import { Body, Controller, Post } from '@nestjs/common';

import { ConnectionService } from './connection.service';

@Controller('websocket')
export class WebsocketController {
  constructor(private readonly connection: ConnectionService) {}

  @Post('broadcast')
  async broadcastMessage(@Body() body: Record<string, unknown>): Promise<void> {
    console.log(body.connectionIds);

    await this.connection.broadcastMessage(body.connectionIds as string[], {
      messageId: '1',
      name: 'Testing',
      body: { message: 'Hello world' },
    });
  }
}
