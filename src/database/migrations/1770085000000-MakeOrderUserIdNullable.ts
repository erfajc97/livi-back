import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Guest checkout: una orden puede crearse sin sesión, por lo que `userId` deja
 * de ser obligatorio. La FK a users se mantiene (nullable). El `down` vuelve a
 * exigir NOT NULL — fallará si existen órdenes guest (userId NULL), en cuyo
 * caso hay que reasignarlas o borrarlas antes de revertir.
 */
export class MakeOrderUserIdNullable1770085000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" ALTER COLUMN "userId" SET NOT NULL
    `);
  }
}
