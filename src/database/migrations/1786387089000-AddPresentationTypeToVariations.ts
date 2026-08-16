import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * REQ-056 — Tipo de presentación por variante.
 * Agrega product_variations."presentationType" ('decant' | 'sellada' | 'original').
 * Default 'decant' para no romper datos actuales; las variantes que ya eran
 * botella completa (isFullBottle = true) se reclasifican como 'sellada'.
 * El nombre del tipo enum sigue la convención de TypeORM ({tabla}_{columna}_enum).
 */
export class AddPresentationTypeToVariations1786387089000
  implements MigrationInterface
{
  name = 'AddPresentationTypeToVariations1786387089000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Idempotente: en las bases donde synchronize ya había creado el tipo o la
    // columna, esta migración abortaba y bloqueaba a las siguientes.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'product_variations_presentationtype_enum'
        ) THEN
          CREATE TYPE "product_variations_presentationtype_enum" AS ENUM ('decant', 'sellada', 'original');
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD COLUMN IF NOT EXISTS "presentationType" "product_variations_presentationtype_enum" NOT NULL DEFAULT 'decant'`,
    );
    await queryRunner.query(
      `UPDATE "product_variations" SET "presentationType" = 'sellada' WHERE "isFullBottle" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variations" DROP COLUMN IF EXISTS "presentationType"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "product_variations_presentationtype_enum"`,
    );
  }
}
