import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HealthService } from './health.service';

@Injectable()
export class DatabaseReadyService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseReadyService.name);

  constructor(private readonly healthService: HealthService) {}

  async onModuleInit(): Promise<void> {
    const status = await this.healthService.getCatalogStatus();
    this.logger.log(
      `database=${status.database} products=${status.products} categories=${status.categories} banners=${status.banners} productCount=${status.productCount}`,
    );
    if (this.healthService.isReady(status)) return;

    throw new Error(
      `La base "${status.database}" no tiene el catálogo (products/categories/banners). ` +
        `El API está mirando la base equivocada: revisa DB_NAME. ` +
        `No actives DB_SYNCHRONIZE: crearía tablas vacías y parecería arreglado sin los productos.`,
    );
  }
}
