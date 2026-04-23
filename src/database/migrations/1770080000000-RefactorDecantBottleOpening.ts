import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorDecantBottleOpening1770080000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns
    await queryRunner.query(
      `ALTER TABLE "products" ADD "totalMl" decimal(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "openBottleMlRemaining" decimal(10,2) DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD "mlSize" decimal(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD "isFullBottle" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "combo_products" ADD "productVariationId" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "mlDeducted" decimal(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "bottlesOpened" integer DEFAULT 0`,
    );

    // Step 2: Migrate existing data
    await queryRunner.query(
      `UPDATE "products" SET "totalMl" = COALESCE("measureValue", 100)`,
    );
    await queryRunner.query(
      `UPDATE "product_variations" SET "mlSize" = COALESCE("measureValue", 10)`,
    );

    // Step 3: Make totalMl NOT NULL now that data is migrated
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "totalMl" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" ALTER COLUMN "mlSize" SET NOT NULL`,
    );

    // Step 4: Drop old columns from products
    // Drop foreign key constraint on parentProductId if exists
    const fkConstraints = await queryRunner.query(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_name = 'products' AND constraint_type = 'FOREIGN KEY'
       AND constraint_name LIKE '%parentProductId%'`,
    );
    for (const fk of fkConstraints) {
      await queryRunner.query(
        `ALTER TABLE "products" DROP CONSTRAINT "${fk.constraint_name}"`,
      );
    }

    // Also check for FK constraints referencing the parent product relationship
    const fkConstraints2 = await queryRunner.query(
      `SELECT tc.constraint_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
       WHERE tc.table_name = 'products' AND tc.constraint_type = 'FOREIGN KEY'
       AND kcu.column_name = 'parentProductId'`,
    );
    for (const fk of fkConstraints2) {
      await queryRunner.query(
        `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}"`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "measureValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "measureUnit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "parentProductId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "type"`,
    );

    // Drop type enum if it exists
    await queryRunner.query(
      `DROP TYPE IF EXISTS "products_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "products_measureunit_enum"`,
    );

    // Step 5: Drop old columns from product_variations
    await queryRunner.query(
      `ALTER TABLE "product_variations" DROP COLUMN IF EXISTS "stock"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" DROP COLUMN IF EXISTS "measureValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" DROP COLUMN IF EXISTS "measureUnit"`,
    );

    // Step 6: Add FK constraint for combo_products.productVariationId
    await queryRunner.query(
      `ALTER TABLE "combo_products" ADD CONSTRAINT "FK_combo_products_productVariationId"
       FOREIGN KEY ("productVariationId") REFERENCES "product_variations"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK on combo_products.productVariationId
    await queryRunner.query(
      `ALTER TABLE "combo_products" DROP CONSTRAINT IF EXISTS "FK_combo_products_productVariationId"`,
    );

    // Restore old columns on product_variations
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD "stock" integer DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD "measureValue" decimal(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" ADD "measureUnit" varchar`,
    );

    // Migrate data back on product_variations
    await queryRunner.query(
      `UPDATE "product_variations" SET "measureValue" = "mlSize"`,
    );

    // Restore old columns on products
    await queryRunner.query(
      `CREATE TYPE "products_type_enum" AS ENUM ('perfume')`,
    );
    await queryRunner.query(
      `CREATE TYPE "products_measureunit_enum" AS ENUM ('ml', 'oz', 'g', 'kg')`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "type" "products_type_enum" DEFAULT 'perfume'`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "measureValue" decimal(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "measureUnit" "products_measureunit_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "parentProductId" bigint`,
    );

    // Migrate data back on products
    await queryRunner.query(
      `UPDATE "products" SET "measureValue" = "totalMl"`,
    );

    // Re-add self-referential FK
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_parentProductId"
       FOREIGN KEY ("parentProductId") REFERENCES "products"("id") ON DELETE SET NULL`,
    );

    // Drop new columns
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "bottlesOpened"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "mlDeducted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "combo_products" DROP COLUMN IF EXISTS "productVariationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" DROP COLUMN IF EXISTS "isFullBottle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variations" DROP COLUMN IF EXISTS "mlSize"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "openBottleMlRemaining"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "totalMl"`,
    );
  }
}
