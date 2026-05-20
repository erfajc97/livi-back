import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Track per-item stock deduction timestamp so the same order can be processed
 * twice (payment confirmation retry, manual reconciliation, status re-transition)
 * without double-deducting stock.
 */
export class AddStockDeductedAtToOrderItem1770082000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD COLUMN "stockDeductedAt" TIMESTAMP NULL
    `);

    // Backfill: any order item belonging to an order already in a fulfillment
    // status was already deducted historically — mark it so future processing
    // doesn't double-deduct.
    await queryRunner.query(`
      UPDATE "order_items" oi
      SET "stockDeductedAt" = COALESCE(o."receivedAt", o."createdAt")
      FROM "orders" o
      WHERE oi."orderId" = o.id
        AND o.status IN (
          'order_received',
          'order_accepted',
          'order_shipped',
          'order_delivered',
          'order_delayed'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_items" DROP COLUMN "stockDeductedAt"
    `);
  }
}
