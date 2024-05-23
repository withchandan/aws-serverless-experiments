import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';

import { AppModule } from './app.module';

export async function createApp(): Promise<INestApplicationContext> {
  return NestFactory.createApplicationContext(AppModule, { logger: false });
}
