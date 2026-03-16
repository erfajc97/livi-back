import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTypeOptionsVariants1770066284203 implements MigrationInterface {
    name = 'CreateTypeOptionsVariants1770066284203'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_options" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "productType" character varying(50), "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3916b02fb43aa725f8167c718e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_option_values" ("id" BIGSERIAL NOT NULL, "value" character varying NOT NULL, "displayName" character varying, "optionId" bigint NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c5ddd425048b2df1a76cb9d5226" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_variations" ("id" BIGSERIAL NOT NULL, "productId" bigint NOT NULL, "price" numeric(10,2), "stock" integer NOT NULL DEFAULT '0', "sku" character varying, "name" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_99ffcb7287adf3b4134158ddd38" UNIQUE ("sku"), CONSTRAINT "PK_353249b2d301e047dde9ef0487c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a5bbc1e7886ded70ebf6a7c6f7" ON "product_variations" ("productId") `);
        await queryRunner.query(`CREATE TABLE "product_variation_option_values" ("variationId" bigint NOT NULL, "optionValueId" bigint NOT NULL, CONSTRAINT "PK_38529b783e2483532b73914eb2a" PRIMARY KEY ("variationId", "optionValueId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c45c5d6206e9e2c58a35e0dbc7" ON "product_variation_option_values" ("variationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a7301516013bd6006e38d522a9" ON "product_variation_option_values" ("optionValueId") `);
        await queryRunner.query(`ALTER TABLE "product_option_values" ADD CONSTRAINT "FK_194c98d26740b931df39c29ac1c" FOREIGN KEY ("optionId") REFERENCES "product_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variations" ADD CONSTRAINT "FK_a5bbc1e7886ded70ebf6a7c6f7d" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variation_option_values" ADD CONSTRAINT "FK_c45c5d6206e9e2c58a35e0dbc78" FOREIGN KEY ("variationId") REFERENCES "product_variations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_variation_option_values" ADD CONSTRAINT "FK_a7301516013bd6006e38d522a99" FOREIGN KEY ("optionValueId") REFERENCES "product_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variation_option_values" DROP CONSTRAINT "FK_a7301516013bd6006e38d522a99"`);
        await queryRunner.query(`ALTER TABLE "product_variation_option_values" DROP CONSTRAINT "FK_c45c5d6206e9e2c58a35e0dbc78"`);
        await queryRunner.query(`ALTER TABLE "product_variations" DROP CONSTRAINT "FK_a5bbc1e7886ded70ebf6a7c6f7d"`);
        await queryRunner.query(`ALTER TABLE "product_option_values" DROP CONSTRAINT "FK_194c98d26740b931df39c29ac1c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7301516013bd6006e38d522a9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c45c5d6206e9e2c58a35e0dbc7"`);
        await queryRunner.query(`DROP TABLE "product_variation_option_values"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5bbc1e7886ded70ebf6a7c6f7"`);
        await queryRunner.query(`DROP TABLE "product_variations"`);
        await queryRunner.query(`DROP TABLE "product_option_values"`);
        await queryRunner.query(`DROP TABLE "product_options"`);
    }

}
