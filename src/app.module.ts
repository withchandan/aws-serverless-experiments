import { Module } from '@nestjs/common';

import { GlobalModule } from './global/global.module';
import { HealthModule } from './health/health.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({ imports: [GlobalModule, HealthModule, WebsocketModule] })
export class AppModule {}
