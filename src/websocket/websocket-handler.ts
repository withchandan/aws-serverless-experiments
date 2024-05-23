import { INestApplicationContext } from '@nestjs/common';
import { APIGatewayEvent } from 'aws-lambda';

import { createApp } from '../standalone-app';

let app: INestApplicationContext;

export const handler = async (
  event: APIGatewayEvent,
): Promise<Record<string, unknown>> => {
  if (!app) {
    app = await createApp();

    console.log('Websocket handler initialized');
  }

  const { connectionId, routeKey } = event.requestContext;

  if (routeKey === '$connect') {
    console.log('Got connection request', connectionId);
  }

  if (routeKey === '$disconnect') {
    console.log('Got disconnection request', connectionId);
  }

  console.log(`Unknown route key ${routeKey}`);

  return { statusCode: 200, isBase64Encoded: false, body: 'Success' };
};
