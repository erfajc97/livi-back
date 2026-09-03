import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductOrderToLandingSections1787700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "landing_sections"
      ADD COLUMN IF NOT EXISTS "productOrder" integer[] NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "landing_sections" DROP COLUMN IF EXISTS "productOrder"
    `);
  }
}
