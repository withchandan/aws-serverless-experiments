import { Injectable } from '@nestjs/common';

import {
  PostToConnectionCommand,
  ApiGatewayManagementApiClient,
} from '@aws-sdk/client-apigatewaymanagementapi';

@Injectable()
export class ConnectionService {
  private readonly apiGatewayClient: ApiGatewayManagementApiClient;

  constructor() {
    const apiEndpoint = new URL(
      `https://oi9p3t10wa.execute-api.ap-south-1.amazonaws.com/dev`,
    );

    this.apiGatewayClient = new ApiGatewayManagementApiClient({
      region: 'ap-south-1',
      endpoint: apiEndpoint.href,
    });
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
      connectionIds.map(async (id) => {
        const command = new PostToConnectionCommand({
          Data: serializedPayload,
          ConnectionId: id,
        });

        try {
          const gatewayResponse = await this.apiGatewayClient.send(command);

          console.log({
            message: 'broadcast websocket api gateway response',
            meta: { connectionId: id, gatewayResponse },
          });
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
