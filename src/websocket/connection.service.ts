import { Injectable } from '@nestjs/common';

import {
  PostToConnectionCommand,
  ApiGatewayManagementApiClient,
} from '@aws-sdk/client-apigatewaymanagementapi';

import { ConditionType, DynamodbService } from '../global';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConnectionService {
  private readonly table: string;
  private readonly apiGatewayClient: ApiGatewayManagementApiClient;

  constructor(
    private readonly config: ConfigService,
    private readonly db: DynamodbService,
  ) {
    const region = this.config.get<string>('REGION');
    const websocketId = this.config.get<string>('AWS_WEBSOCKET_API_ID');
    this.table = this.config.get<string>('TABLE_NAME');

    const apiEndpoint = new URL(
      `https://${websocketId}.execute-api.ap-south-1.amazonaws.com/dev`,
    );

    this.apiGatewayClient = new ApiGatewayManagementApiClient({
      region,
      endpoint: apiEndpoint.href,
    });
  }

  public async connect(connectionId: string): Promise<void> {
    const date = new Date().toISOString();

    await this.db.write(this.table, {
      pk: 'connection',
      sk: connectionId,
      entity: 'connection',
      createdAt: date,
      updatedAt: date,
    });
  }

  public async disconnect(connectionId: string): Promise<void> {
    await this.db.delete(this.table, 'connection', connectionId);
  }

  public async sendMessage(
    connectionId: string,
    message: Record<string, unknown>,
  ): Promise<void> {
    const wsMessage: Record<string, unknown> = {
      headers: {
        messageId: message.messageId,
        messageName: message.name,
      },
      metadata: {},
      payload: message.body,
    };

    const serializedPayload = Buffer.from(JSON.stringify(wsMessage));

    const command = new PostToConnectionCommand({
      Data: serializedPayload,
      ConnectionId: connectionId,
    });

    try {
      const gatewayResponse = await this.apiGatewayClient.send(command);

      console.log({
        message: 'websocket api gateway response',
        meta: { connectionId, gatewayResponse },
      });
    } catch (err) {
      console.error({
        message: 'failed sending websocket message',
        connectionId,
        error: err as Error,
      });
    }
  }

  public async broadcastMessage(
    connectionIds: string[],
    message: Record<string, unknown>,
  ): Promise<string[]> {
    let ids: string[];

    if (connectionIds && connectionIds.length) {
      ids = connectionIds;
    } else {
      const { items: connections } = await this.db.query<{
        pk: string;
        sk: string;
      }>(this.table, {
        primaryKey: {
          attName: 'pk',
          attValue: 'connection',
          condition: ConditionType.EQUAL,
        },
      });

      ids = connections.map((connection) => connection.sk);
    }

    const failedUserIds: string[] = [];

    const wsMessage = {
      headers: {
        messageId: message.messageId,
        messageName: message.name,
      },
      metadata: {},
      payload: message.body,
    };

    const serializedPayload = Buffer.from(JSON.stringify(wsMessage));

    await Promise.all(
      ids.map(async (id) => {
        const command = new PostToConnectionCommand({
          Data: serializedPayload,
          ConnectionId: id,
        });

        try {
          const gatewayResponse = await this.apiGatewayClient.send(command);

          console.log(
            `broadcast websocket api gateway response ${gatewayResponse.$metadata.httpStatusCode}`,
          );
        } catch (err) {
          failedUserIds.push(id);
          console.error({
            message: 'broadcast failed sending websocket message',
            connectionId: id,
            error: err as Error,
          });
        }
      }),
    );

    return failedUserIds;
  }
}
