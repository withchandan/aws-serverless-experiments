import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { randomUUID } from 'crypto';

let server: Handler;
const containerId = randomUUID();

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  console.log({ containerId });

  if (server) {
    console.log('Cached Server');

    return server(event, context, callback);
  }

  console.log('New Server');

  server = await bootstrap();

  return server(event, context, callback);
};
