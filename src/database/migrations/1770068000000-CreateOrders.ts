import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrders1770068000000 implements MigrationInterface {
    name = 'CreateOrders1770068000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create order_status enum
        await queryRunner.query(`
            CREATE TYPE "order_status_enum" AS ENUM(
                'order_created',
                'order_received',
                'order_accepted',
                'order_rejected',
                'order_shipped',
                'order_delivered',
                'order_delayed',
                'order_cancelled'
            )
        `);

        // Create orders table
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" BIGSERIAL NOT NULL,
                "orderNumber" character varying NOT NULL,
                "userId" bigint NOT NULL,
                "status" "order_status_enum" NOT NULL DEFAULT 'order_created',
                "total" numeric(10,2) NOT NULL,
                "paymentMethod" character varying,
                "paymentStatus" character varying,
                "paymentReference" character varying,
                "shippingAddress" character varying,
                "shippingCity" character varying,
                "shippingPostalCode" character varying,
                "shippingCountry" character varying,
                "notes" text,
                "receivedAt" TIMESTAMP,
                "acceptedAt" TIMESTAMP,
                "rejectedAt" TIMESTAMP,
                "shippedAt" TIMESTAMP,
                "deliveredAt" TIMESTAMP,
                "cancelledAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_orders_orderNumber" UNIQUE ("orderNumber"),
                CONSTRAINT "PK_orders" PRIMARY KEY ("id")
            )
        `);

        // Create order_items table
        await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" BIGSERIAL NOT NULL,
                "orderId" bigint NOT NULL,
                "productId" bigint,
                "productVariationId" bigint,
                "price" numeric(10,2) NOT NULL,
                "quantity" integer NOT NULL,
                "subtotal" numeric(10,2) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order_items" PRIMARY KEY ("id")
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_orders_userId" ON "orders" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_orderNumber" ON "orders" ("orderNumber")`);
        await queryRunner.query(`CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_order_items_productId" ON "order_items" ("productId")`);
        await queryRunner.query(`CREATE INDEX "IDX_order_items_productVariationId" ON "order_items" ("productVariationId")`);

        // Create foreign keys
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_orders_userId"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "order_items"
            ADD CONSTRAINT "FK_order_items_orderId"
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "order_items"
            ADD CONSTRAINT "FK_order_items_productId"
            FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "order_items"
            ADD CONSTRAINT "FK_order_items_productVariationId"
            FOREIGN KEY ("productVariationId") REFERENCES "product_variations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_productVariationId"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_productId"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_orderId"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_userId"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "orders"`);

        // Drop enum
        await queryRunner.query(`DROP TYPE "order_status_enum"`);
    }
}