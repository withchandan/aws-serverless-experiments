import {
  EventBridge,
  PutEventsCommand,
  PutEventsCommandInput,
} from '@aws-sdk/client-eventbridge';

import { Injectable } from '@nestjs/common';

@Injectable()
export class EventBridgeService {
  private readonly eventBridgeClient: EventBridge;

  private readonly eventBusName: string;

  private readonly source: string;

  constructor() {
    this.eventBridgeClient = new EventBridge({ region: 'ap-south-1' });
    this.eventBusName = 'default';
    this.source = 'experiments';
  }

  async send(event: Record<string, unknown>): Promise<void> {
    const params: PutEventsCommandInput = {
      Entries: [
        {
          Source: this.source,
          EventBusName: this.eventBusName,
          DetailType: 'event.headers.eventName',
          Detail: JSON.stringify(event),
        },
      ],
    };
    const putEventsCommand = new PutEventsCommand(params);

    await this.eventBridgeClient.send(putEventsCommand);
  }
}
