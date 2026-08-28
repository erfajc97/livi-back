import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Banners de las páginas /catalogo/perfumes y /bajo-pedido (imagen desktop + móvil),
 * distintos del carrusel hero. Postgres no deja usar un valor nuevo en la misma
 * transacción en versiones viejas, así que esta migración corre fuera de tx.
 */
export class AddCatalogBannerTypes1786600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const typeName = await this.findEnumTypeName(queryRunner);
    if (!typeName) return;

    await queryRunner.query(
      `ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS 'catalog_perfumes'`,
    );
    await queryRunner.query(
      `ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS 'catalog_bajo_pedido'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres no permite quitar valores de un enum sin recrear el tipo.
    void queryRunner;
  }

  private async findEnumTypeName(queryRunner: QueryRunner): Promise<string | null> {
    const rows: Array<{ typename: string }> = await queryRunner.query(`
      SELECT t.typname AS typename
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_type t ON t.oid = a.atttypid
      WHERE c.relname = 'banners' AND a.attname = 'type' AND a.attnum > 0
    `);
    return rows[0]?.typename ?? null;
  }
}
