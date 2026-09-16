import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseReadyService } from './database-ready.service';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, DatabaseReadyService, AdminBootstrapService],
})
export class HealthModule {}
