import { SQSRecord } from 'aws-lambda';

import { SQSEventParser } from './sqs-event-parser';

describe('QueueEventParser', () => {
  let parser: SQSEventParser<SQSRecord>;

  beforeAll(() => {
    parser = new SQSEventParser({
      messageId: '059f36b4-87a3-44ab-83d2-661975830a7d',
      receiptHandle: 'AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...',
      body: JSON.stringify({
        version: '0',
        id: '6a7e8feb-b491-4cf7-a9f1-bf3703467718',
        'detail-type': 'EC2 Instance State-change Notification',
        source: 'aws.ec2',
        account: '111122223333',
        time: '2017-12-22T18:43:48Z',
        region: 'us-east-1',
        resources: [
          'arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0',
        ],
        detail: {
          'instance-id': ' i-1234567890abcdef0',
          state: 'terminated',
        },
      }),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1545082649183',
        SenderId: 'AIDAIENQZJOLO23YVJ4VO',
        ApproximateFirstReceiveTimestamp: '1545082649185',
      },
      messageAttributes: {},
      md5OfBody: 'e4e68fb7bd0e697a0ae8f1bb342846b3',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:my-queue',
      awsRegion: 'us-east-1',
    });
  });

  it('should be defined', () => {
    expect(parser).toBeDefined();
  });

  it('should return message id', () => {
    expect(parser.messageId).toBe('059f36b4-87a3-44ab-83d2-661975830a7d');
  });

  it('should return receipt handle id', () => {
    expect(parser.receiptId).toBe('AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...');
  });

  it('should return body', () => {
    expect(parser.body).toStrictEqual({
      version: '0',
      id: '6a7e8feb-b491-4cf7-a9f1-bf3703467718',
      'detail-type': 'EC2 Instance State-change Notification',
      source: 'aws.ec2',
      account: '111122223333',
      time: '2017-12-22T18:43:48Z',
      region: 'us-east-1',
      resources: [
        'arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0',
      ],
      detail: {
        'instance-id': ' i-1234567890abcdef0',
        state: 'terminated',
      },
    });
  });
});
