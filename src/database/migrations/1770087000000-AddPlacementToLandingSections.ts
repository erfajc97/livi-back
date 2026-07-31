import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Las secciones de productos ahora pueden vivir en la home o en el bloque de
 * recomendados del carrito ("No te pierdas estos productos"). Las existentes
 * se quedan en la home.
 */
export class AddPlacementToLandingSections1770087000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "landing_sections"
      ADD COLUMN "placement" character varying(20) NOT NULL DEFAULT 'home'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "landing_sections" DROP COLUMN "placement"
    `);
  }
}
