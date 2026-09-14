import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Variante = combinación color (name) + talla (size).
 * NULL en size = la variante no tiene talla (producto de talla única).
 */
export class AddVariationSize1789350000000 implements MigrationInterface {
  name = 'AddVariationSize1789350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD COLUMN IF NOT EXISTS "size" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variations" DROP COLUMN IF EXISTS "size"`);
  }
}
