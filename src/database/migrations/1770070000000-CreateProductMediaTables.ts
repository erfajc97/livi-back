import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductMediaTables1770070000000 implements MigrationInterface {
  name = 'CreateProductMediaTables1770070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create product_images table
    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id" BIGSERIAL NOT NULL,
        "productId" bigint NOT NULL,
        "url" character varying NOT NULL,
        "key" character varying NOT NULL,
        "alt" character varying,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_images" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_product_images_productId" ON "product_images" ("productId")`,
    );

    // Create product_videos table
    await queryRunner.query(`
      CREATE TABLE "product_videos" (
        "id" BIGSERIAL NOT NULL,
        "productId" bigint NOT NULL,
        "url" character varying NOT NULL,
        "key" character varying NOT NULL,
        "title" character varying,
        "description" character varying,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_videos" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_product_videos_productId" ON "product_videos" ("productId")`,
    );

    // Create product_variation_images table
    await queryRunner.query(`
      CREATE TABLE "product_variation_images" (
        "id" BIGSERIAL NOT NULL,
        "variationId" bigint NOT NULL,
        "url" character varying NOT NULL,
        "key" character varying NOT NULL,
        "alt" character varying,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_variation_images" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_product_variation_images_variationId" ON "product_variation_images" ("variationId")`,
    );

    // Create product_variation_videos table
    await queryRunner.query(`
      CREATE TABLE "product_variation_videos" (
        "id" BIGSERIAL NOT NULL,
        "variationId" bigint NOT NULL,
        "url" character varying NOT NULL,
        "key" character varying NOT NULL,
        "title" character varying,
        "description" character varying,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_variation_videos" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_product_variation_videos_variationId" ON "product_variation_videos" ("variationId")`,
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "product_images"
      ADD CONSTRAINT "FK_product_images_productId"
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "product_videos"
      ADD CONSTRAINT "FK_product_videos_productId"
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variation_images"
      ADD CONSTRAINT "FK_product_variation_images_variationId"
      FOREIGN KEY ("variationId") REFERENCES "product_variations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variation_videos"
      ADD CONSTRAINT "FK_product_variation_videos_variationId"
      FOREIGN KEY ("variationId") REFERENCES "product_variations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "product_variation_videos" DROP CONSTRAINT "FK_product_variation_videos_variationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variation_images" DROP CONSTRAINT "FK_product_variation_images_variationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_videos" DROP CONSTRAINT "FK_product_videos_productId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_productId"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_product_variation_videos_variationId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_variation_images_variationId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_videos_productId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_images_productId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "product_variation_videos"`);
    await queryRunner.query(`DROP TABLE "product_variation_images"`);
    await queryRunner.query(`DROP TABLE "product_videos"`);
    await queryRunner.query(`DROP TABLE "product_images"`);
  }
}
