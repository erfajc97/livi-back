import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import type { QueryRunner } from 'typeorm';
import { Product } from './entities/product.entity';
import { BottleEvent, BottleEventType } from './entities/bottle-event.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(BottleEvent)
    private bottleEventRepository: Repository<BottleEvent>,
    private dataSource: DataSource,
  ) {}
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

    // Log bottle event if bottles were opened
    if (bottlesOpened > 0) {
      const event = new BottleEvent();
      event.productId = product.id;
      event.eventType = BottleEventType.BOTTLE_OPENED;
      event.sealedBottlesBefore = lockedProduct.stock + bottlesOpened;
      event.sealedBottlesAfter = lockedProduct.stock;
      event.openMlBefore = openMl;
      event.openMlAfter = Number(lockedProduct.openBottleMlRemaining);
      event.note = `Apertura automática por orden (${totalMlNeeded}ml solicitados)`;
      event.createdBy = 'sistema';
      await queryRunner.manager.save(BottleEvent, event);
    }

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

  /**
   * Open a sealed bottle for decanting.
   * Decreases stock by 1, adds ml to openBottleMlRemaining.
   */
  async openBottle(
    productId: number,
    options?: { mlRemaining?: number; note?: string; createdBy?: string },
  ): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) throw new BadRequestException('Producto no encontrado');
      if (product.stock < 1) throw new BadRequestException('No hay botellas selladas disponibles');

      const sealedBefore = product.stock;
      const openMlBefore = Number(product.openBottleMlRemaining || 0);
      const mlToAdd = options?.mlRemaining ?? Number(product.totalMl);

      product.stock -= 1;
      product.openBottleMlRemaining = openMlBefore + mlToAdd;

      await queryRunner.manager.save(Product, product);

      const event = new BottleEvent();
      event.productId = productId;
      event.eventType = BottleEventType.BOTTLE_OPENED;
      event.sealedBottlesBefore = sealedBefore;
      event.sealedBottlesAfter = product.stock;
      event.openMlBefore = openMlBefore;
      event.openMlAfter = product.openBottleMlRemaining;
      event.note = options?.note || undefined;
      event.createdBy = options?.createdBy || undefined;
      await queryRunner.manager.save(BottleEvent, event);

      await queryRunner.commitTransaction();
      return product;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Manually adjust open bottle ml remaining (for corrections).
   */
  async adjustOpenMl(
    productId: number,
    newOpenMl: number,
    options?: { note?: string; createdBy?: string },
  ): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) throw new BadRequestException('Producto no encontrado');

      const openMlBefore = Number(product.openBottleMlRemaining || 0);
      product.openBottleMlRemaining = newOpenMl;

      await queryRunner.manager.save(Product, product);

      const event = new BottleEvent();
      event.productId = productId;
      event.eventType = BottleEventType.ML_ADJUSTED;
      event.sealedBottlesBefore = product.stock;
      event.sealedBottlesAfter = product.stock;
      event.openMlBefore = openMlBefore;
      event.openMlAfter = newOpenMl;
      event.note = options?.note || undefined;
      event.createdBy = options?.createdBy || undefined;
      await queryRunner.manager.save(BottleEvent, event);

      await queryRunner.commitTransaction();
      return product;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get bottle events history for a product.
   */
  async getBottleEvents(productId: number): Promise<BottleEvent[]> {
    return this.bottleEventRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
