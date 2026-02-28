import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToUsers1770067000000 implements MigrationInterface {
    name = 'AddRoleToUsers1770067000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for role
        await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM('client', 'admin')`);
        
        // Add role column with default value
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "role" "user_role_enum" NOT NULL DEFAULT 'client'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove role column
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        
        // Drop enum type
        await queryRunner.query(`DROP TYPE "user_role_enum"`);
    }
}