import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfill: every product gets a full-bottle ProductVariation so the manual
 * sale picker, ordering flow, and stock service have a canonical sellable unit.
 */
export class BackfillFullBottleVariations1770081000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // For each product without an isFullBottle=true variation, create one
    // using the product's totalMl + price defaults.
    await queryRunner.query(`
      INSERT INTO "product_variations"
        ("productId", "isFullBottle", "mlSize", "price", "name", "sku", "isActive", "createdAt", "updatedAt")
      SELECT
        p.id,
        true,
        COALESCE(NULLIF(p."totalMl", 0), 100),
        p.price,
        p.name || ' - Botella ' || COALESCE(NULLIF(p."totalMl", 0), 100) || 'ml',
        LOWER(REGEXP_REPLACE(SUBSTRING(p.name FROM 1 FOR 40), '\\s+', '-', 'g')) || '-bottle-' || p.id,
        true,
        NOW(),
        NOW()
      FROM "products" p
      WHERE NOT EXISTS (
        SELECT 1 FROM "product_variations" v
        WHERE v."productId" = p.id AND v."isFullBottle" = true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove only auto-generated full-bottle variations (identified by the
    // -bottle-<id> SKU suffix produced by the backfill).
    await queryRunner.query(`
      DELETE FROM "product_variations"
      WHERE "isFullBottle" = true
        AND "sku" LIKE '%-bottle-%'
    `);
  }
}
