import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeasureToVariations1770073000000 implements MigrationInterface {
  name = 'AddMeasureToVariations1770073000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD "measureValue" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD "measureUnit" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variations" DROP COLUMN "measureUnit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" DROP COLUMN "measureValue"`,
    );
  }
}
