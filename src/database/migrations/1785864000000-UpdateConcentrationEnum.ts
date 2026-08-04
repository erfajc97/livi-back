import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Actualiza el enum de concentración:
 *  - Quita:  ELIXIR_DE_PARFUM, PARFUM_EXTRAIT
 *  - Agrega: ELIXIR, PARFUM, EXTRAIT_DE_PARFUM, EAU_DE_TOILETTE_INTENSE
 * Postgres no permite quitar valores de un enum, así que se recrea el tipo.
 * Datos existentes: ELIXIR_DE_PARFUM → ELIXIR, PARFUM_EXTRAIT → EXTRAIT_DE_PARFUM.
 */
export class UpdateConcentrationEnum1785864000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "concentration_enum_new" AS ENUM (
        'EAU_DE_PARFUM', 'EAU_DE_TOILETTE', 'EAU_DE_TOILETTE_INTENSE',
        'EAU_DE_COLOGNE', 'BODY_MIST', 'ELIXIR', 'PARFUM', 'EXTRAIT_DE_PARFUM'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ALTER COLUMN "concentration" TYPE "concentration_enum_new"
      USING (
        CASE "concentration"::text
          WHEN 'ELIXIR_DE_PARFUM' THEN 'ELIXIR'
          WHEN 'PARFUM_EXTRAIT' THEN 'EXTRAIT_DE_PARFUM'
          ELSE "concentration"::text
        END
      )::"concentration_enum_new"
    `);
    await queryRunner.query(`DROP TYPE "concentration_enum"`);
    await queryRunner.query(
      `ALTER TYPE "concentration_enum_new" RENAME TO "concentration_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "concentration_enum_old" AS ENUM (
        'EAU_DE_PARFUM', 'EAU_DE_TOILETTE', 'ELIXIR_DE_PARFUM',
        'EAU_DE_COLOGNE', 'BODY_MIST', 'PARFUM_EXTRAIT'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ALTER COLUMN "concentration" TYPE "concentration_enum_old"
      USING (
        CASE "concentration"::text
          WHEN 'ELIXIR' THEN 'ELIXIR_DE_PARFUM'
          WHEN 'EXTRAIT_DE_PARFUM' THEN 'PARFUM_EXTRAIT'
          WHEN 'PARFUM' THEN 'PARFUM_EXTRAIT'
          WHEN 'EAU_DE_TOILETTE_INTENSE' THEN 'EAU_DE_TOILETTE'
          ELSE "concentration"::text
        END
      )::"concentration_enum_old"
    `);
    await queryRunner.query(`DROP TYPE "concentration_enum"`);
    await queryRunner.query(
      `ALTER TYPE "concentration_enum_old" RENAME TO "concentration_enum"`,
    );
  }
}
