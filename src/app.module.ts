import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GlobalModule } from './global/global.module';
import { HealthModule } from './health/health.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GlobalModule,
    HealthModule,
    WebsocketModule,
  ],
})
export class AppModule {}
