import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Venta manual: el cliente llega por redes y no tiene ficha previa, así que sus
 * datos de despacho viven en la propia orden. Faltaban dos que Servientrega
 * exige y que no estaban en ninguna columna: cédula y provincia.
 */
export class AddOrderCustomerCedulaAndProvince1786400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerCedula" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingProvince" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingProvince"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "customerCedula"`,
    );
  }
}
