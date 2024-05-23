/* istanbul ignore file */
import { randomUUID } from 'node:crypto';

import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  CreateQueueCommand,
  DeleteMessageBatchCommand,
  DeleteQueueCommand,
  GetQueueUrlCommand,
  ListQueuesCommand,
  PurgeQueueCommand,
  SendMessageBatchCommand,
  SendMessageCommand,
  SQSClient,
  SQSClientConfig,
} from '@aws-sdk/client-sqs';

import {
  Queue,
  PushMessageRes,
  DeleteMessageRes,
  ListQueueOptions,
  PushMessageInput,
  DeleteMessageInput,
} from './interface';

@Injectable()
export class SqsService implements Queue {
  public readonly client: SQSClient;

  private queueUrlMap: Map<string, string>;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION');

    const sqsConfig: SQSClientConfig = { region };

    this.client = new SQSClient(sqsConfig);
    this.queueUrlMap = new Map() as Map<string, string>;
  }

  /**
   * Creates a new queue.
   * @param  {string} name Queue name.
   * @returns {Promise<string>} A promise to the queue name.
   */
  public async createQueue(name: string): Promise<string> {
    const command = new CreateQueueCommand({ QueueName: name });

    await this.client.send(command);

    return name;
  }

  /**
   * Deletes the queue specified by the name, regardless of the queue's contents.
   * @param  {string} name Queue name.
   * @returns {Promise<void>} Return nothing on successful deletion of queue.
   */
  public async deleteQueue(name: string): Promise<void> {
    const url = await this.getQueueUrl(name);
    const command = new DeleteQueueCommand({ QueueUrl: url });

    await this.client.send(command);
  }

  /**
   * Deletes the messages of the specified queue name.
   * @param  {string} name Queue name.
   * @returns {Promise<void>} Return nothing on successful deletion of queued items.
   */
  public async clearQueue(name: string): Promise<void> {
    const url = await this.getQueueUrl(name);
    const command = new PurgeQueueCommand({ QueueUrl: url });

    await this.client.send(command);
  }

  /**
   * Return the url of given queue name.
   * @param  {string} name Queue name.
   * @returns {Promise<string>} Return the url of given queue name.
   */
  public async getQueueUrl(name: string): Promise<string> {
    let url = this.queueUrlMap.get(name);

    if (!url) {
      const command = new GetQueueUrlCommand({ QueueName: name });
      const { QueueUrl } = await this.client.send(command);

      if (!QueueUrl) {
        throw new Error(`${name} queue does not exist`);
      }
      url = QueueUrl;
      this.queueUrlMap.set(name, QueueUrl);
    }

    return url;
  }

  /**
   * Delivers messages to the specified queue. A message can include only JSON and string.
   * @param  {string} name Queue name.
   * @param  {PushMessageInput|PushMessageInput[]} messages The message(s) you want to push inside queue.
   * @returns {Proise<PushMessageRes>} Return succeeded and failed message.
   */
  public async push(
    name: string,
    messages: PushMessageInput | PushMessageInput[],
  ): Promise<PushMessageRes> {
    const url = await this.getQueueUrl(name);

    if (Array.isArray(messages)) {
      /* istanbul ignore next */
      const entries = messages.map((msg) => ({
        Id: randomUUID(),
        MessageBody:
          typeof msg.message === 'string'
            ? msg.message
            : JSON.stringify(msg.message),
        ...(msg.delaySeconds && { DelaySeconds: msg.delaySeconds }),
        ...(msg.messageGroupId && { MessageGroupId: msg.messageGroupId }),
        ...(msg.messageDeduplicationId && {
          MessageDeduplicationId: msg.messageDeduplicationId,
        }),
      }));
      const params = { QueueUrl: url, Entries: entries };
      const command = new SendMessageBatchCommand(params);
      const { Successful, Failed } = await this.client.send(command);

      const success = Successful?.length
        ? Successful.map((msg) => ({
            id: msg.Id,
            messageId: msg.MessageId,
          }))
        : [];

      const failed = Failed?.length
        ? Failed.map((msg) => ({
            id: msg.Id,
            errorMsg: msg.Message,
            errorCode: msg.Code,
          }))
        : [];

      return { success, failed };
    }

    const { delaySeconds, message, messageGroupId, messageDeduplicationId } =
      messages;

    try {
      /* istanbul ignore next */
      const command = new SendMessageCommand({
        QueueUrl: url,
        MessageBody:
          typeof message === 'string' ? message : JSON.stringify(message),
        ...(delaySeconds && { DelaySeconds: delaySeconds }),
        ...(messageGroupId && { MessageGroupId: messageGroupId }),
        ...(messageDeduplicationId && {
          MessageDeduplicationId: messageDeduplicationId,
        }),
      });
      const { MessageId } = await this.client.send(command);

      /* istanbul ignore next */
      return { success: [{ messageId: MessageId || '' }], failed: [] };
    } catch (err) {
      return { success: [], failed: [{ errorMsg: (err as Error).message }] };
    }
  }

  /**
   * Deletes the specified messages from the specified queue.
   * @param  {string} name Queue name.
   * @param  {DeleteMessageInput|DeleteMessageInput[]} message Required data to delete messages from queue.
   * @returns {Promise<DeleteMessageRes>} Return succeeded and failed message.
   */
  public async deleteMessage(
    name: string,
    message: DeleteMessageInput | DeleteMessageInput[],
  ): Promise<DeleteMessageRes> {
    const url = await this.getQueueUrl(name);

    let newMessage;

    if (Array.isArray(message)) {
      newMessage = message;
    } else {
      newMessage = [message];
    }

    const entries = newMessage.map((m) => ({
      Id: m.id,
      ReceiptHandle: m.receiptHandle,
    }));
    const params = { QueueUrl: url, Entries: entries };
    const command = new DeleteMessageBatchCommand(params);
    const { Successful, Failed } = await this.client.send(command);

    const success = Successful?.length
      ? Successful.map((msg) => ({ id: msg.Id }))
      : [];
    const failed = Failed?.length
      ? Failed.map((msg) => ({
          id: msg.Id,
          errorMsg: msg.Message,
          errorCode: msg.Code,
        }))
      : [];

    return { success, failed };
  }

  /**
   * Returns a list of your queues. The maximum number of queues that can be returned is 1,000.
   * If you specify a value for the optional prefix parameter, only queues with a name that
   * begins with the specified value are returned.
   * @param  {ListQueueOptions} options? Optional parameter to filter queues.
   * @returns {Promise<string[]>} Return lists of queues.
   */
  public async listQueues(options?: ListQueueOptions): Promise<string[]> {
    const { prefix } = options || {};
    const command = new ListQueuesCommand({
      ...(prefix && { QueueNamePrefix: prefix }),
    });
    const { QueueUrls } = await this.client.send(command);

    /* istanbul ignore next */
    return QueueUrls || [];
  }
}
