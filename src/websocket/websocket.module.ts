import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { WebsocketController } from './websocket.controller';

@Module({
  providers: [ConnectionService],
  controllers: [WebsocketController],
})
export class WebsocketModule {}
