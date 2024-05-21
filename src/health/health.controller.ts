import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  async health() {
    return this.healthService.health();
  }

  @Get('version')
  findOne() {
    return this.healthService.version();
  }
}
