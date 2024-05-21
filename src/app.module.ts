import { Module } from '@nestjs/common';

import { GlobalModule } from './global/global.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [GlobalModule, HealthModule],
})
export class AppModule {}
