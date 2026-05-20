import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Payment methods CRUD — admin manages bank accounts / card / cash / etc.
 * used by bills and finance transactions selects.
 */
export class CreatePaymentMethodsTable1770084000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance_payment_methods" (
        "id" BIGSERIAL PRIMARY KEY,
        "name" VARCHAR(120) NOT NULL,
        "detail" TEXT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Seed common defaults so the bill select isn't empty on day one
    await queryRunner.query(`
      INSERT INTO "finance_payment_methods" ("name", "detail")
      VALUES
        ('Efectivo', 'Pago en efectivo'),
        ('Transferencia', 'Transferencia bancaria'),
        ('Payphone', 'Tarjeta vía Payphone'),
        ('T. Crédito', 'Pago con tarjeta de crédito')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "finance_payment_methods"`);
  }
}
