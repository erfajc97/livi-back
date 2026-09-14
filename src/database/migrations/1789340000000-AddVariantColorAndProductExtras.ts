import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * LIVI PDP estilo minabaie:
 * - product_variations.colorHex: swatch de color definido por el admin (picker hex).
 * - products.sizes: tallas disponibles (JSON array de strings).
 * - products.instagramPosts: posts de Instagram de la ficha (JSON [{url, image}]).
 */
export class AddVariantColorAndProductExtras1789340000000 implements MigrationInterface {
  name = 'AddVariantColorAndProductExtras1789340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD COLUMN IF NOT EXISTS "colorHex" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sizes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "instagramPosts" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "instagramPosts"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "sizes"`);
    await queryRunner.query(`ALTER TABLE "product_variations" DROP COLUMN IF EXISTS "colorHex"`);
  }
}
