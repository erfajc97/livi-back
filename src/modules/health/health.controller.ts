import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Liveness + catalog tables present' })
  async check() {
    const status = await this.healthService.getCatalogStatus();
    if (!this.healthService.isReady(status)) {
      throw new ServiceUnavailableException({
        message: 'Catalog tables missing in this database. Check DB_NAME.',
        ...status,
      });
    }
    return { ok: true, ...status };
  }
}
