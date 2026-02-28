import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCart1770069000000 implements MigrationInterface {
    name = 'CreateCart1770069000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create carts table
        await queryRunner.query(`
            CREATE TABLE "carts" (
                "id" BIGSERIAL NOT NULL,
                "userId" bigint NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_carts_userId" UNIQUE ("userId"),
                CONSTRAINT "PK_carts" PRIMARY KEY ("id")
            )
        `);

        // Create cart_items table
        await queryRunner.query(`
            CREATE TABLE "cart_items" (
                "id" BIGSERIAL NOT NULL,
                "cartId" bigint NOT NULL,
                "productId" bigint,
                "productVariationId" bigint,
                "quantity" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cart_items" PRIMARY KEY ("id")
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_carts_userId" ON "carts" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_cart_items_cartId" ON "cart_items" ("cartId")`);
        await queryRunner.query(`CREATE INDEX "IDX_cart_items_productId" ON "cart_items" ("productId")`);
        await queryRunner.query(`CREATE INDEX "IDX_cart_items_productVariationId" ON "cart_items" ("productVariationId")`);

        // Create foreign keys
        await queryRunner.query(`
            ALTER TABLE "carts"
            ADD CONSTRAINT "FK_carts_userId"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "cart_items"
            ADD CONSTRAINT "FK_cart_items_cartId"
            FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "cart_items"
            ADD CONSTRAINT "FK_cart_items_productId"
            FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "cart_items"
            ADD CONSTRAINT "FK_cart_items_productVariationId"
            FOREIGN KEY ("productVariationId") REFERENCES "product_variations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_productVariationId"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_productId"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cartId"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_userId"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "cart_items"`);
        await queryRunner.query(`DROP TABLE "carts"`);
    }
}