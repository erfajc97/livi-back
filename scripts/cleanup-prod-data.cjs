/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Gemelo en JS puro de cleanup-prod-data.ts, para correr DENTRO del contenedor
 * de producción (que no tiene ts-node porque hace `npm prune --omit=dev`).
 * Solo depende de `pg`, que sí es dependencia de producción.
 *
 *   docker cp scripts/cleanup-prod-data.cjs api-ecommerce:/app/cleanup.cjs
 *   docker exec -it api-ecommerce node /app/cleanup.cjs            # dry-run
 *   docker exec -it api-ecommerce node /app/cleanup.cjs --apply    # ejecuta
 *
 * Flags: --apply --keep=mail1,mail2 --keep-orders --keep-order-ids=1,2
 *        --products=41,58 --find=turathi --wipe-subscribers --wipe-order-finance
 */
const { Client } = require('pg');

const raw = process.argv.slice(2);
const val = (name) => {
  const hit = raw.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const list = (name) =>
  (val(name) || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const args = {
  apply: raw.includes('--apply'),
  keepEmails: list('keep').map((e) => e.toLowerCase()),
  keepOrderIds: list('keep-order-ids'),
  productIds: list('products'),
  wipeSubscribers: raw.includes('--wipe-subscribers'),
  wipeOrderFinance: raw.includes('--wipe-order-finance'),
  keepOrders: raw.includes('--keep-orders'),
  find: val('find'),
};

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const q = async (sql, params = []) => (await client.query(sql, params)).rows;
const tableExists = async (name) =>
  (
    await q(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [name],
    )
  ).length > 0;

async function main() {
  await client.connect();

  console.log('='.repeat(70));
  console.log(`DB: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`MODO: ${args.apply ? 'APPLY (borra de verdad)' : 'DRY-RUN (no escribe nada)'}`);
  console.log('='.repeat(70));

  // ------------------------------------------- buscar productos por nombre
  if (args.find) {
    const hits = await q(
      `SELECT p.id::text, p.name, COALESCE(s.name, '') AS marca, p.price::text, p."isActive"
         FROM products p
         LEFT JOIN subcategories s ON s.id = p."subcategoryId"
        WHERE p.name ILIKE $1 ORDER BY p.id`,
      [`%${args.find}%`],
    );
    console.log(`\nBÚSQUEDA "${args.find}" — ${hits.length} producto(s):`);
    hits.forEach((p) =>
      console.log(
        `    #${p.id} "${p.name}" — ${p.marca} — $${p.price} — ${p.isActive ? 'activo' : 'inactivo'}`,
      ),
    );
    console.log('\nBúsqueda terminada. Nada fue borrado.');
    await client.end();
    return;
  }

  // ---------------------------------------------------------------- usuarios
  const users = await q(`SELECT id::text, email, role::text FROM users ORDER BY id`);
  const kept = users.filter(
    (u) => u.role.toLowerCase() === 'admin' || args.keepEmails.includes(u.email.toLowerCase()),
  );
  const doomedUsers = users.filter((u) => !kept.includes(u));
  const doomedUserIds = doomedUsers.map((u) => u.id);

  console.log(`\nUSUARIOS: ${users.length} total`);
  console.log(`  se conservan (${kept.length}):`);
  kept.forEach((u) => console.log(`    #${u.id} ${u.email} [${u.role}]`));
  console.log(`  se borran (${doomedUsers.length}):`);
  doomedUsers.forEach((u) => console.log(`    #${u.id} ${u.email} [${u.role}]`));

  if (kept.length === 0) {
    throw new Error('ABORTADO: ningún usuario quedaría en pie (no hay admin). Revisa --keep.');
  }

  // ----------------------------------------------------------------- órdenes
  let doomedOrderIds = [];
  if (!args.keepOrders) {
    const orders = await q(
      `SELECT id::text, "orderNumber", "customerEmail", total::text, status::text
         FROM orders ORDER BY id`,
    );
    doomedOrderIds = orders.filter((o) => !args.keepOrderIds.includes(o.id)).map((o) => o.id);

    console.log(`\nÓRDENES: ${orders.length} total, se borran ${doomedOrderIds.length}`);
    orders.forEach((o) =>
      console.log(
        `    ${args.keepOrderIds.includes(o.id) ? 'KEEP  ' : 'BORRAR'} #${o.id} ${o.orderNumber} ` +
          `${o.customerEmail || '(sin email)'} $${o.total} [${o.status}]`,
      ),
    );

    if (doomedOrderIds.length > 0) {
      const stock = await q(
        `SELECT oi."productId"::text AS "productId", p.name,
                SUM(oi.quantity)::int AS unidades,
                SUM(COALESCE(oi."mlDeducted", 0))::numeric AS ml,
                SUM(COALESCE(oi."bottlesOpened", 0))::int AS frascos
           FROM order_items oi
           LEFT JOIN products p ON p.id = oi."productId"
          WHERE oi."orderId" = ANY($1::bigint[]) AND oi."stockDeductedAt" IS NOT NULL
          GROUP BY oi."productId", p.name
          ORDER BY p.name`,
        [doomedOrderIds],
      );
      if (stock.length) {
        console.log(
          `\n  ⚠ STOCK YA DESCONTADO por estas órdenes (borrarlas NO lo devuelve — ajústalo a mano en el admin):`,
        );
        stock.forEach((s) =>
          console.log(
            `    ${s.name || `producto #${s.productId}`}: ${s.unidades} u, ${s.ml} ml, ${s.frascos} frascos abiertos`,
          ),
        );
      }
    }
  }

  // --------------------------------------------------------------- productos
  if (args.productIds.length) {
    const prods = await q(
      `SELECT p.id::text, p.name, COALESCE(s.name, '') AS marca, p.price::text
         FROM products p
         LEFT JOIN subcategories s ON s.id = p."subcategoryId"
        WHERE p.id = ANY($1::bigint[]) ORDER BY p.id`,
      [args.productIds],
    );
    console.log(`\nPRODUCTOS a borrar (${prods.length} de ${args.productIds.length} ids pedidos):`);
    prods.forEach((p) => console.log(`    #${p.id} "${p.name}" — ${p.marca} — $${p.price}`));
    const missing = args.productIds.filter((id) => !prods.some((p) => p.id === id));
    if (missing.length) console.log(`    ⚠ ids inexistentes: ${missing.join(', ')}`);
    console.log('    ⚠ VERIFICA LOS NOMBRES DE ARRIBA antes de correr con --apply.');
  }

  if (!args.apply) {
    console.log('\nDRY-RUN terminado. Nada fue borrado. Repite con --apply para ejecutar.');
    await client.end();
    return;
  }

  // -------------------------------------------------------------- ejecución
  const del = async (label, sql, params = []) => {
    const res = await client.query(sql, params);
    console.log(`  ${label}: ${res.rowCount}`);
  };

  await client.query('BEGIN');
  try {
    console.log('\nBORRANDO...');

    if (doomedOrderIds.length) {
      if (await tableExists('transactions')) {
        await del(
          'transactions (COGS / fee de órdenes)',
          `DELETE FROM transactions
            WHERE "referenceType" LIKE 'order_%' AND "referenceId" = ANY($1::bigint[])`,
          [doomedOrderIds],
        );
      }
      await del(
        'order_status_history',
        `DELETE FROM order_status_history WHERE "orderId" = ANY($1::bigint[])`,
        [doomedOrderIds],
      );
      await del('order_items', `DELETE FROM order_items WHERE "orderId" = ANY($1::bigint[])`, [
        doomedOrderIds,
      ]);
      await del('orders', `DELETE FROM orders WHERE id = ANY($1::bigint[])`, [doomedOrderIds]);
    }

    if (doomedUserIds.length) {
      if (await tableExists('coupon_usages')) {
        await del('coupon_usages', `DELETE FROM coupon_usages WHERE "userId" = ANY($1::bigint[])`, [
          doomedUserIds,
        ]);
      }
      if (await tableExists('cart_items')) {
        await del(
          'cart_items',
          `DELETE FROM cart_items
            WHERE "cartId" IN (SELECT id FROM carts WHERE "userId" = ANY($1::bigint[]))`,
          [doomedUserIds],
        );
      }
      if (await tableExists('carts')) {
        await del('carts', `DELETE FROM carts WHERE "userId" = ANY($1::bigint[])`, [doomedUserIds]);
      }
      if (await tableExists('user_addresses')) {
        await del(
          'user_addresses',
          `DELETE FROM user_addresses WHERE "userId" = ANY($1::bigint[])`,
          [doomedUserIds],
        );
      }
      await del(
        'órdenes conservadas → userId NULL',
        `UPDATE orders SET "userId" = NULL WHERE "userId" = ANY($1::bigint[])`,
        [doomedUserIds],
      );
      await del('users', `DELETE FROM users WHERE id = ANY($1::bigint[])`, [doomedUserIds]);
    }

    if (args.wipeSubscribers && (await tableExists('subscribers'))) {
      await del('subscribers (newsletter)', `DELETE FROM subscribers`);
    }

    if (args.wipeOrderFinance && (await tableExists('transactions'))) {
      await del(
        'transactions restantes de órdenes',
        `DELETE FROM transactions WHERE "referenceType" LIKE 'order_%'`,
      );
    }

    if (args.productIds.length) {
      await del('bottle_events', `DELETE FROM bottle_events WHERE "productId" = ANY($1::bigint[])`, [
        args.productIds,
      ]);
      if (await tableExists('combo_products')) {
        await del(
          'combo_products',
          `DELETE FROM combo_products WHERE "productId" = ANY($1::bigint[])`,
          [args.productIds],
        );
      }
      await del(
        'product_variations (+ imágenes/videos en cascada)',
        `DELETE FROM product_variations WHERE "productId" = ANY($1::bigint[])`,
        [args.productIds],
      );
      await del('products', `DELETE FROM products WHERE id = ANY($1::bigint[])`, [args.productIds]);
    }

    await client.query('COMMIT');
    console.log('\n✅ COMMIT. Limpieza aplicada.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ ROLLBACK — nada se borró. Error:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
