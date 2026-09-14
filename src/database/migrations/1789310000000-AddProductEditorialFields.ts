import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * LIVI — campos editoriales de la ficha estilo minabaie:
 * - commonUses: JSON array de strings (acordeón "Usos comunes").
 * - pairsWith: JSON array de IDs de productos ("Combina con" / Pairs With).
 */
export class AddProductEditorialFields1789310000000 implements MigrationInterface {
  name = 'AddProductEditorialFields1789310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "commonUses" text`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pairsWith" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "pairsWith"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "commonUses"`);
  }
}
