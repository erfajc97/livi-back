import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Actualiza el enum de concentración:
 *  - Quita:  ELIXIR_DE_PARFUM, PARFUM_EXTRAIT
 *  - Agrega: ELIXIR, PARFUM, EXTRAIT_DE_PARFUM, EAU_DE_TOILETTE_INTENSE
 * Postgres no permite quitar valores de un enum, así que se recrea el tipo.
 * Datos existentes: ELIXIR_DE_PARFUM → ELIXIR, PARFUM_EXTRAIT → EXTRAIT_DE_PARFUM.
 *
 * El tipo puede llamarse distinto según el entorno ("concentration_enum" si lo
 * creó la migración AddProductFilterFields, o "products_concentration_enum" si
 * lo creó synchronize), así que se descubre dinámicamente desde pg_catalog y se
 * conserva el nombre original.
 */
export class UpdateConcentrationEnum1785864000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const typeName = await this.findEnumTypeName(queryRunner);

    await queryRunner.query(
      `ALTER TYPE "${typeName}" RENAME TO "${typeName}_old"`,
    );
    await queryRunner.query(`
      CREATE TYPE "${typeName}" AS ENUM (
        'EAU_DE_PARFUM', 'EAU_DE_TOILETTE', 'EAU_DE_TOILETTE_INTENSE',
        'EAU_DE_COLOGNE', 'BODY_MIST', 'ELIXIR', 'PARFUM', 'EXTRAIT_DE_PARFUM'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ALTER COLUMN "concentration" TYPE "${typeName}"
      USING (
        CASE "concentration"::text
          WHEN 'ELIXIR_DE_PARFUM' THEN 'ELIXIR'
          WHEN 'PARFUM_EXTRAIT' THEN 'EXTRAIT_DE_PARFUM'
          ELSE "concentration"::text
        END
      )::"${typeName}"
    `);
    await queryRunner.query(`DROP TYPE "${typeName}_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const typeName = await this.findEnumTypeName(queryRunner);

    await queryRunner.query(
      `ALTER TYPE "${typeName}" RENAME TO "${typeName}_old"`,
    );
    await queryRunner.query(`
      CREATE TYPE "${typeName}" AS ENUM (
        'EAU_DE_PARFUM', 'EAU_DE_TOILETTE', 'ELIXIR_DE_PARFUM',
        'EAU_DE_COLOGNE', 'BODY_MIST', 'PARFUM_EXTRAIT'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ALTER COLUMN "concentration" TYPE "${typeName}"
      USING (
        CASE "concentration"::text
          WHEN 'ELIXIR' THEN 'ELIXIR_DE_PARFUM'
          WHEN 'EXTRAIT_DE_PARFUM' THEN 'PARFUM_EXTRAIT'
          WHEN 'PARFUM' THEN 'PARFUM_EXTRAIT'
          WHEN 'EAU_DE_TOILETTE_INTENSE' THEN 'EAU_DE_TOILETTE'
          ELSE "concentration"::text
        END
      )::"${typeName}"
    `);
    await queryRunner.query(`DROP TYPE "${typeName}_old"`);
  }

  /** Nombre real del tipo enum que usa products.concentration en esta base. */
  private async findEnumTypeName(queryRunner: QueryRunner): Promise<string> {
    const rows: Array<{ typename: string }> = await queryRunner.query(`
      SELECT t.typname AS typename
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_type t ON t.oid = a.atttypid
      WHERE c.relname = 'products' AND a.attname = 'concentration' AND a.attnum > 0
    `);
    if (!rows.length) {
      throw new Error(
        'No se encontró la columna products.concentration para migrar su enum',
      );
    }
    return rows[0].typename;
  }
}
