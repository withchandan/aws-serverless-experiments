/* istanbul ignore file */
import { SQSRecord } from 'aws-lambda';

export class SQSEventParser<T> {
  protected readonly msgId: string;

  protected readonly msgGid: string;

  protected readonly msgReceiptId: string;

  protected readonly messageBody: T;

  constructor(event: SQSRecord) {
    this.msgId = event.messageId;
    this.msgGid = event.attributes.MessageGroupId;
    this.msgReceiptId = event.receiptHandle;
    this.messageBody = JSON.parse(event.body) as T;
  }

  public get messageId(): string {
    return this.msgId;
  }

  public get messageGroupId(): string {
    return this.msgGid;
  }

  public get receiptId(): string {
    return this.msgReceiptId;
  }

  public get body(): T {
    return this.messageBody;
  }
}
