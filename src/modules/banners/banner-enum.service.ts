import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

const CATALOG_BANNER_TYPES = ['catalog_perfumes', 'catalog_bajo_pedido'] as const;

/**
 * Completa el enum de banners.type sin pasar por TypeORM migrationsRun.
 * ALTER TYPE ... ADD VALUE IF NOT EXISTS es idempotente y no toca datos.
 */
@Injectable()
export class BannerEnumService implements OnModuleInit {
  private readonly logger = new Logger(BannerEnumService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureCatalogTypes();
    } catch (err) {
      this.logger.error(
        'No se pudo ampliar el enum de banners.type. El API sigue arriba.',
        err instanceof Error ? err.stack : err,
      );
    }
  }

  async ensureCatalogTypes(): Promise<void> {
    const rows: Array<{ typename: string }> = await this.dataSource.query(`
      SELECT t.typname AS typename
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_type t ON t.oid = a.atttypid
      WHERE c.relname = 'banners'
        AND a.attname = 'type'
        AND a.attnum > 0
        AND t.typtype = 'e'
    `);
    const typeName = rows[0]?.typename;
    if (!typeName) return;

    for (const value of CATALOG_BANNER_TYPES) {
      await this.dataSource.query(
        `ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}'`,
      );
    }
    this.logger.log(`enum ${typeName} incluye ${CATALOG_BANNER_TYPES.join(', ')}`);
  }
}
