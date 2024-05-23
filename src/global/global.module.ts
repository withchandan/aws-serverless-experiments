import { Global, Module } from '@nestjs/common';

import {
  DynamodbService,
  SqsService,
  S3Service,
  SesService,
  EventBridgeService,
} from './aws';

@Global()
@Module({
  providers: [
    SqsService,
    S3Service,
    SesService,
    DynamodbService,
    EventBridgeService,
  ],
  exports: [
    DynamodbService,
    SqsService,
    S3Service,
    SesService,
    EventBridgeService,
  ],
})
export class GlobalModule {}
