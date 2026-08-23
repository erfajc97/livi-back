import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type CatalogDbStatus = {
  database: string;
  products: boolean;
  categories: boolean;
  banners: boolean;
  productCount: number | null;
};

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async getCatalogStatus(): Promise<CatalogDbStatus> {
    const [{ database }] = await this.dataSource.query(
      'SELECT current_database() AS database',
    );
    const [regs] = await this.dataSource.query(
      `SELECT
         to_regclass('public.products') IS NOT NULL AS products,
         to_regclass('public.categories') IS NOT NULL AS categories,
         to_regclass('public.banners') IS NOT NULL AS banners`,
    );
    let productCount: number | null = null;
    if (regs.products) {
      const [{ n }] = await this.dataSource.query(
        'SELECT COUNT(*)::int AS n FROM products',
      );
      productCount = n;
    }
    return {
      database,
      products: Boolean(regs.products),
      categories: Boolean(regs.categories),
      banners: Boolean(regs.banners),
      productCount,
    };
  }

  isReady(status: CatalogDbStatus): boolean {
    return status.products && status.categories && status.banners;
  }
}
