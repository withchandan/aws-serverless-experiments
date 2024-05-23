import { INestApplicationContext } from '@nestjs/common';
import { APIGatewayEvent } from 'aws-lambda';

import { ConnectionService } from './connection.service';
import { WebsocketModule } from './websocket.module';

import { createApp } from '../standalone-app';

let app: INestApplicationContext;
let connection: ConnectionService;

export const handler = async (
  event: APIGatewayEvent,
): Promise<Record<string, unknown>> => {
  if (!app) {
    app = await createApp();

    connection = app.select(WebsocketModule).get(ConnectionService);

    console.log('Websocket handler initialized');
  }

  const { connectionId, routeKey } = event.requestContext;

  if (routeKey === '$connect') {
    console.log('Got connection request', connectionId);
    await connection.connect(connectionId);
  }

  if (routeKey === '$disconnect') {
    console.log('Got disconnection request', connectionId);
    await connection.disconnect(connectionId);
  }

  if (routeKey === 'message') {
    console.log('Got message request', connectionId);
  }

  return { statusCode: 200, isBase64Encoded: false, body: 'Success' };
};
