import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductTypesTable1770072000000 implements MigrationInterface {
  name = 'CreateProductTypesTable1770072000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_types" (
        "id" BIGSERIAL NOT NULL,
        "name" character varying NOT NULL,
        "slug" character varying,
        "description" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_types" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_types"`);
  }
}
