import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductFilterFields1770075000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types if they don't exist
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "gender_enum" AS ENUM ('HOMBRE', 'MUJER', 'UNISEX'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "time_of_day_enum" AS ENUM ('DIA', 'NOCHE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "concentration_enum" AS ENUM ('EAU_DE_PARFUM', 'EAU_DE_TOILETTE', 'ELIXIR_DE_PARFUM', 'EAU_DE_COLOGNE', 'BODY_MIST', 'PARFUM_EXTRAIT'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "projection_enum" AS ENUM ('DISCRETA', 'MODERADA', 'ALTA'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);

    // Add columns if they don't exist
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gender" "gender_enum"`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "timeOfDay" "time_of_day_enum"`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "concentration" "concentration_enum"`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "projection" "projection_enum"`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "discount" decimal(5,2)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "discount"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "projection"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "concentration"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "timeOfDay"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "gender"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "projection_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "concentration_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "time_of_day_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "gender_enum"`);
  }
}
