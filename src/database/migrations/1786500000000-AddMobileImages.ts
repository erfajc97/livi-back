import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Arte vertical para móvil.
 *
 * Los banners y las portadas de categoría/marca se subían en una sola versión,
 * pensada para desktop: en el teléfono el recorte se comía el producto y el
 * texto. Ahora cada uno guarda además una imagen móvil opcional; si no se sube,
 * el front sigue usando la de escritorio.
 */
export class AddMobileImages1786500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['banners', 'categories', 'subcategories']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "mobileImageUrl" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "mobileImageKey" character varying`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['banners', 'categories', 'subcategories']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "mobileImageKey"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "mobileImageUrl"`,
      );
    }
  }
}
