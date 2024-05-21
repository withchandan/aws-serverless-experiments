import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({ imports: [HttpModule] })
export class GlobalModule {}
