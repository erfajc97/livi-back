import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Track how many units of an order item could not be fulfilled from existing
 * stock and were back-ordered (bajo pedido). Surfaced in order detail so ops
 * know which units must be sourced.
 */
export class AddBajoPedidoQuantityToOrderItem1770083000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD COLUMN "bajoPedidoQuantity" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_items" DROP COLUMN "bajoPedidoQuantity"
    `);
  }
}
