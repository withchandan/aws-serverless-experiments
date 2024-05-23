/* eslint-disable object-curly-newline */
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';
import { mockClient } from 'aws-sdk-client-mock';
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
} from '@aws-sdk/client-sqs';

import { SqsService } from './sqs.service';

const mockSQS = mockClient(SQSClient);

describe('SqsService', () => {
  let service: SqsService;

  const QUEUE_NAME = 'test-queue';
  const QUEUE_URL = 'test-queue-url';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SqsService, ConfigService],
    }).compile();

    service = module.get<SqsService>(SqsService);
    mockSQS.reset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Create Queue', () => {
    it('should create queue', async () => {
      mockSQS.on(CreateQueueCommand).resolves({});
      expect(await service.createQueue(QUEUE_NAME)).toBe(QUEUE_NAME);
    });
  });

  describe('Delete Queue', () => {
    it('should delete queue', async () => {
      mockSQS
        .on(DeleteQueueCommand)
        .resolves({})
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL });

      expect(await service.deleteQueue(QUEUE_NAME)).toBeUndefined();
    });
  });

  describe('Clear Queue', () => {
    it('should clear queue', async () => {
      mockSQS
        .on(PurgeQueueCommand)
        .resolves({})
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL });

      expect(await service.clearQueue(QUEUE_NAME)).toBeUndefined();
    });
  });

  describe('getQueueUrl', () => {
    it('should return the queue url', async () => {
      mockSQS.on(GetQueueUrlCommand).resolves({ QueueUrl: QUEUE_URL });

      const res = await service.getQueueUrl(QUEUE_NAME);

      expect(res).toBe(QUEUE_URL);
    });

    it('should return the queue url from cache', async () => {
      mockSQS.on(GetQueueUrlCommand).resolves({ QueueUrl: QUEUE_URL });

      await service.getQueueUrl(QUEUE_NAME);
      const queueUrl = await service.getQueueUrl(QUEUE_NAME);

      expect(queueUrl).toBe(QUEUE_URL);
    });

    it('should throw when no queue url is returned', async () => {
      mockSQS.on(GetQueueUrlCommand).resolves({});
      try {
        await service.getQueueUrl(QUEUE_NAME);
      } catch (err) {
        expect(typeof (err as Error).message).toBe('string');
      }
    });
  });

  describe('push', () => {
    it('should throw when queue url is does not found', async () => {
      mockSQS.on(GetQueueUrlCommand).resolves({});

      try {
        await service.push(QUEUE_NAME, { message: { userId: 'user-id-1' } });
      } catch (err) {
        expect((err as Error).message).toBe('test-queue queue does not exist');
      }
    });

    it('should push single message and return result object', async () => {
      const message = { userId: 'user-id-1' };
      const result = { MD5OfMessageBody: 'md5-body', MessageId: '123' };

      mockSQS
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL })
        .on(SendMessageCommand)
        .resolves(result);

      const res = await service.push(QUEUE_NAME, { message, delaySeconds: 1 });

      expect(res).toEqual({ success: [{ messageId: '123' }], failed: [] });
    });

    it('should push single message and return error result', async () => {
      const message = { userId: 'user-id-1' };

      mockSQS
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL })
        .on(SendMessageCommand)
        .rejects(new Error('Failed to push message.'));

      const res = await service.push(QUEUE_NAME, { message, delaySeconds: 1 });

      expect(res).toEqual({
        success: [],
        failed: [{ errorMsg: 'Failed to push message.' }],
      });
    });

    it('should push multiple message and return result object', async () => {
      const message1 = { message: { userId: 'user-id-1' }, delaySeconds: 1 };
      const message2 = { message: { userId: 'user-id-2' } };
      const message3 = { message: { userId: 'user-id-3' } };

      mockSQS
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL })
        .on(SendMessageBatchCommand)
        .resolves({
          Successful: [
            { Id: '1', MessageId: '11', MD5OfMessageBody: undefined },
            { Id: '2', MessageId: '12', MD5OfMessageBody: undefined },
          ],
          Failed: [
            {
              Id: '3',
              Message: 'Error message',
              Code: '101',
              SenderFault: undefined,
            },
          ],
        });

      const res = await service.push(QUEUE_NAME, [
        message1,
        message2,
        message3,
      ]);

      expect(res).toEqual({
        success: [
          { id: '1', messageId: '11' },
          { id: '2', messageId: '12' },
        ],
        failed: [{ id: '3', errorMsg: 'Error message', errorCode: '101' }],
      });
    });

    it('should return empty success array if no item is Successful', async () => {
      const message1 = { message: { userId: 'user-id-1' }, delaySeconds: 1 };

      mockSQS
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL })
        .on(SendMessageBatchCommand)
        .resolves({
          Failed: [
            {
              Id: '1',
              Message: 'Error message',
              Code: '101',
              SenderFault: undefined,
            },
          ],
        });

      const res = await service.push(QUEUE_NAME, [message1]);

      expect(res).toEqual({
        success: [],
        failed: [{ id: '1', errorMsg: 'Error message', errorCode: '101' }],
      });
    });

    it('should return empty failure array if no item fails', async () => {
      const message1 = { message: { userId: 'user-id-1' }, delaySeconds: 1 };

      mockSQS
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL })
        .on(SendMessageBatchCommand)
        .resolves({
          Successful: [
            { Id: '1', MessageId: '11', MD5OfMessageBody: undefined },
          ],
        });

      const res = await service.push(QUEUE_NAME, [message1]);

      expect(res).toEqual({
        success: [{ id: '1', messageId: '11' }],
        failed: [],
      });
    });
  });

  describe('delete messages', () => {
    it('should throw when queue url is not found', async () => {
      mockSQS.on(GetQueueUrlCommand).resolves({});
      try {
        await service.deleteMessage(QUEUE_NAME, {
          id: 'id',
          receiptHandle: 'receiptHandle',
        });
      } catch (err) {
        expect((err as Error).message).toBe('test-queue queue does not exist');
      }
    });

    it('should delete multiple messages', async () => {
      const entries = [
        { id: 'id-1', receiptHandle: 'receipt-handle-1' },
        { id: 'id-2', receiptHandle: 'receipt-handle-2' },
        { id: 'id-3', receiptHandle: 'receipt-handle-3' },
      ];

      mockSQS
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL })
        .on(DeleteMessageBatchCommand)
        .resolves({
          Successful: [{ Id: 'id-1' }, { Id: 'id-2' }],
          Failed: [
            {
              Id: 'id-3',
              Message: 'Error message',
              Code: '102',
              SenderFault: undefined,
            },
          ],
        });

      const res = await service.deleteMessage(QUEUE_NAME, entries);

      expect(res).toEqual({
        success: [{ id: 'id-1' }, { id: 'id-2' }],
        failed: [{ id: 'id-3', errorMsg: 'Error message', errorCode: '102' }],
      });
    });

    it('should delete single message', async () => {
      const result = { Successful: [{ Id: 'id-1' }] };

      mockSQS
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL })
        .on(DeleteMessageBatchCommand)
        .resolves(result);

      const res = await service.deleteMessage(QUEUE_NAME, {
        id: 'id-1',
        receiptHandle: 'receiptHandle',
      });

      expect(res).toEqual({ success: [{ id: 'id-1' }], failed: [] });
    });

    it('should return empty success array is no item is successful', async () => {
      const entries = [{ id: 'id-1', receiptHandle: 'receipt-handle-1' }];

      mockSQS
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL })
        .on(DeleteMessageBatchCommand)
        .resolves({
          Failed: [
            {
              Id: 'id-1',
              Message: 'Error message',
              Code: '102',
              SenderFault: undefined,
            },
          ],
        });

      const res = await service.deleteMessage(QUEUE_NAME, entries);

      expect(res).toEqual({
        success: [],
        failed: [{ id: 'id-1', errorMsg: 'Error message', errorCode: '102' }],
      });
    });

    it('should return empty failure array is no item fails', async () => {
      const entries = [{ id: 'id-1', receiptHandle: 'receipt-handle-1' }];

      mockSQS
        .on(GetQueueUrlCommand)
        .resolves({ QueueUrl: QUEUE_URL })
        .on(DeleteMessageBatchCommand)
        .resolves({
          Successful: [{ Id: 'id-1' }],
        });

      const res = await service.deleteMessage(QUEUE_NAME, entries);

      expect(res).toEqual({
        success: [{ id: 'id-1' }],
        failed: [],
      });
    });
  });

  describe('List Queues', () => {
    it('should list out all queues', async () => {
      const queues = ['https://queue-one'];

      mockSQS.on(ListQueuesCommand).resolves({ QueueUrls: queues });

      const res = await service.listQueues();

      expect(res).toEqual(queues);
    });

    it('should list out all queues with specific prefix', async () => {
      const queues = ['https://messenger-one'];

      mockSQS.on(ListQueuesCommand).resolves({ QueueUrls: queues });
      const res = await service.listQueues({ prefix: 'messenger' });

      expect(res).toEqual(queues);
    });
  });
});
