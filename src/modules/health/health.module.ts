import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseReadyService } from './database-ready.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, DatabaseReadyService],
})
export class HealthModule {}
