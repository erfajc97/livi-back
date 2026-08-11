import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserAddresses1785940000000 implements MigrationInterface {
    name = 'CreateUserAddresses1785940000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user_addresses table
        await queryRunner.query(`
            CREATE TABLE "user_addresses" (
                "id" BIGSERIAL NOT NULL,
                "userId" bigint NOT NULL,
                "alias" character varying NOT NULL,
                "provincia" character varying NOT NULL,
                "ciudad" character varying NOT NULL,
                "direccion" character varying NOT NULL,
                "referencia" character varying,
                "telefono" character varying NOT NULL,
                "isDefault" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_addresses" PRIMARY KEY ("id")
            )
        `);

        // Create index
        await queryRunner.query(`CREATE INDEX "IDX_user_addresses_userId" ON "user_addresses" ("userId")`);

        // Create foreign key
        await queryRunner.query(`
            ALTER TABLE "user_addresses"
            ADD CONSTRAINT "FK_user_addresses_userId"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_addresses" DROP CONSTRAINT "FK_user_addresses_userId"`);
        await queryRunner.query(`DROP TABLE "user_addresses"`);
    }
}
