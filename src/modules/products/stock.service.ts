import { Injectable, BadRequestException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class StockService {
  /**
   * Compute total available ml across open bottle + sealed stock.
   */
  getAvailableMl(product: Product): number {
    return (
      Number(product.openBottleMlRemaining || 0) +
      Number(product.stock || 0) * Number(product.totalMl || 0)
    );
  }

  /**
   * Check if enough ml is available for a decant order.
   */
  checkAvailability(
    product: Product,
    mlSize: number,
    quantity: number,
  ): boolean {
    const totalMlNeeded = mlSize * quantity;
    return this.getAvailableMl(product) >= totalMlNeeded;
  }

  /**
   * Deduct ml for decant orders. Opens sealed bottles as needed.
   * Uses pessimistic_write lock on the product row.
   */
  async deductDecantStock(
    product: Product,
    mlSize: number,
    quantity: number,
    queryRunner: QueryRunner,
  ): Promise<{ mlDeducted: number; bottlesOpened: number }> {
    // Re-load product with pessimistic lock
    const lockedProduct = await queryRunner.manager.findOne(Product, {
      where: { id: product.id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!lockedProduct) {
      throw new BadRequestException('Producto no encontrado');
    }

    const totalMlNeeded = mlSize * quantity;
    const openMl = Number(lockedProduct.openBottleMlRemaining || 0);
    const totalMl = Number(lockedProduct.totalMl);
    let bottlesOpened = 0;

    if (openMl >= totalMlNeeded) {
      // Enough ml in the open bottle
      lockedProduct.openBottleMlRemaining = openMl - totalMlNeeded;
    } else {
      // Need to open sealed bottles
      const remaining = totalMlNeeded - openMl;
      const bottlesNeeded = Math.ceil(remaining / totalMl);

      if (lockedProduct.stock < bottlesNeeded) {
        throw new BadRequestException(
          `Stock insuficiente. Necesita ${bottlesNeeded} botella(s) pero solo hay ${lockedProduct.stock}`,
        );
      }

      lockedProduct.stock -= bottlesNeeded;
      const totalNewMl = bottlesNeeded * totalMl;
      lockedProduct.openBottleMlRemaining = openMl + totalNewMl - totalMlNeeded;
      bottlesOpened = bottlesNeeded;
    }

    await queryRunner.manager.save(Product, lockedProduct);

    // Sync the passed product reference
    product.stock = lockedProduct.stock;
    product.openBottleMlRemaining = lockedProduct.openBottleMlRemaining;

    return { mlDeducted: totalMlNeeded, bottlesOpened };
  }

  /**
   * Deduct sealed bottles for full bottle orders.
   * Uses pessimistic_write lock on the product row.
   */
  async deductFullBottleStock(
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

    if (lockedProduct.stock < quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Necesita ${quantity} botella(s) pero solo hay ${lockedProduct.stock}`,
      );
    }

    lockedProduct.stock -= quantity;
    await queryRunner.manager.save(Product, lockedProduct);

    // Sync the passed product reference
    product.stock = lockedProduct.stock;
  }

  /**
   * Restore ml on order cancellation. Re-seals complete bottles when possible.
   * Uses pessimistic_write lock on the product row.
   */
  async restoreDecantStock(
    product: Product,
    mlDeducted: number,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const lockedProduct = await queryRunner.manager.findOne(Product, {
      where: { id: product.id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!lockedProduct) {
      throw new BadRequestException('Producto no encontrado');
    }

    const totalMl = Number(lockedProduct.totalMl);
    lockedProduct.openBottleMlRemaining =
      Number(lockedProduct.openBottleMlRemaining || 0) + mlDeducted;

    // Re-seal complete bottles
    while (lockedProduct.openBottleMlRemaining >= totalMl) {
      lockedProduct.stock += 1;
      lockedProduct.openBottleMlRemaining -= totalMl;
    }

    await queryRunner.manager.save(Product, lockedProduct);

    // Sync the passed product reference
    product.stock = lockedProduct.stock;
    product.openBottleMlRemaining = lockedProduct.openBottleMlRemaining;
  }

  /**
   * Restore sealed bottles on order cancellation.
   * Uses pessimistic_write lock on the product row.
   */
  async restoreFullBottleStock(
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
