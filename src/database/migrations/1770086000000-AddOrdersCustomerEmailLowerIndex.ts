import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índice parcial funcional para vincular órdenes guest al iniciar sesión.
 * Solo indexa órdenes sin dueño (userId IS NULL) por LOWER(customerEmail),
 * que es exactamente el filtro de linkGuestOrders. Al ser parcial, el índice
 * es pequeño (solo huérfanas) y la búsqueda case-insensitive no hace scan.
 */
export class AddOrdersCustomerEmailLowerIndex1770086000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_customer_email_lower_unlinked"
      ON "orders" (LOWER("customerEmail"))
      WHERE "userId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_orders_customer_email_lower_unlinked"
    `);
  }
}
