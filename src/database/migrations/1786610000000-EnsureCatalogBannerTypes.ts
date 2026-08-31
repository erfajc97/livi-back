import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La migración anterior añadía valores de enum dentro de una transacción.
 * En Postgres eso puede fallar (o no dejar usar el valor). Se vuelve a
 * asegurar fuera de tx; IF NOT EXISTS la hace idempotente.
 */
export class EnsureCatalogBannerTypes1786610000000 implements MigrationInterface {
  transaction = false;

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
    void queryRunner;
  }

  private async findEnumTypeName(queryRunner: QueryRunner): Promise<string | null> {
    const rows: Array<{ typename: string }> = await queryRunner.query(`
      SELECT t.typname AS typename
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_type t ON t.oid = a.atttypid
      WHERE c.relname = 'banners'
        AND a.attname = 'type'
        AND a.attnum > 0
        AND t.typtype = 'e'
    `);
    return rows[0]?.typename ?? null;
  }
}
