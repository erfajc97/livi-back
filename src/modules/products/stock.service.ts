import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { QueryRunner } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class StockService {
  constructor(private dataSource: DataSource) {}

  /**
   * Check if enough units are available for an order.
   */
  checkAvailability(product: Product, quantity: number): boolean {
    return Number(product.stock || 0) >= quantity;
  }

  /**
   * Deduct units for an order.
   * Never throws on insufficient stock — any shortfall is returned as
   * `pendingQuantity` so the caller can decide how to handle it.
   * Uses pessimistic_write lock on the product row.
   */
  async deductStock(
    product: Product,
    quantity: number,
    queryRunner: QueryRunner,
  ): Promise<{ pendingQuantity: number }> {
    const lockedProduct = await queryRunner.manager.findOne(Product, {
      where: { id: product.id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!lockedProduct) {
      throw new BadRequestException('Producto no encontrado');
    }

    const fulfilled = Math.min(quantity, Math.max(0, lockedProduct.stock));
    const pendingQuantity = quantity - fulfilled;

    if (fulfilled > 0) {
      lockedProduct.stock -= fulfilled;
      await queryRunner.manager.save(Product, lockedProduct);
    }

    product.stock = lockedProduct.stock;
    return { pendingQuantity };
  }

  /**
   * Restore units on order cancellation.
   * Uses pessimistic_write lock on the product row.
   */
  async restoreStock(
    product: Product,
    quantity: number,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const lockedProduct = await queryRunner.manager.findOne(Product, {
      where: { id: product.id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!lockedProduct) {
      throw new BadRequestException('Producto no encontrado');
    }

    lockedProduct.stock += quantity;
    await queryRunner.manager.save(Product, lockedProduct);

    // Sync the passed product reference
    product.stock = lockedProduct.stock;
  }
}
