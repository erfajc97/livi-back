import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBajoPedidoColumn1770074000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD "bajoPedido" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "subcategories" ADD "bajoPedido" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "brands" ADD "bajoPedido" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "products" ADD "bajoPedido" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "bajoPedido"`);
    await queryRunner.query(`ALTER TABLE "brands" DROP COLUMN "bajoPedido"`);
    await queryRunner.query(`ALTER TABLE "subcategories" DROP COLUMN "bajoPedido"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "bajoPedido"`);
  }
}
