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
 *        --products=41,58 --combos=3 --find=turathi --wipe-subscribers --wipe-order-finance
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
  comboIds: list('combos'),
  wipeSubscribers: raw.includes('--wipe-subscribers'),
  wipeOrderFinance: raw.includes('--wipe-order-finance'),
  keepOrders: raw.includes('--keep-orders'),
  find: val('find'),
  backupJson: val('backup-json'),
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

    const combos = await q(
      `SELECT c.id::text, c.name, c."finalPrice"::text AS precio, c."isActive",
              c."parentComboId"::text AS padre
         FROM combos c
        WHERE c.name ILIKE $1
           OR EXISTS (SELECT 1 FROM combo_products cp
                        JOIN products p2 ON p2.id = cp."productId"
                       WHERE cp."comboId" = c.id AND p2.name ILIKE $1)
        ORDER BY c.id`,
      [`%${args.find}%`],
    );
    console.log(`\nCOMBOS que coinciden (por nombre o por producto que traen) — ${combos.length}:`);
    for (const c of combos) {
      console.log(
        `    #${c.id} "${c.name}" — $${c.precio} — ${c.isActive ? 'activo' : 'inactivo'}` +
          `${c.padre ? ` — versión del combo #${c.padre}` : ''}`,
      );
      const items = await q(
        `SELECT p.name, cp.quantity
           FROM combo_products cp
           LEFT JOIN products p ON p.id = cp."productId"
          WHERE cp."comboId" = $1::bigint
          ORDER BY cp.id`,
        [c.id],
      );
      items.forEach((i) => console.log(`        · ${i.quantity}x ${i.name || '(producto borrado)'}`));
    }

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

  // ----------------------------------------------------------------- combos
  if (args.comboIds.length) {
    const combos = await q(
      `SELECT id::text, name, "finalPrice"::text AS precio, "isActive", "parentComboId"::text AS padre
         FROM combos WHERE id = ANY($1::bigint[]) ORDER BY id`,
      [args.comboIds],
    );
    console.log(`\nCOMBOS a borrar (${combos.length} de ${args.comboIds.length} ids pedidos):`);
    for (const c of combos) {
      console.log(
        `    #${c.id} "${c.name}" — $${c.precio} — ${c.isActive ? 'activo' : 'inactivo'}` +
          `${c.padre ? ` — versión del combo #${c.padre}` : ''}`,
      );
      const items = await q(
        `SELECT p.name, cp.quantity
           FROM combo_products cp
           LEFT JOIN products p ON p.id = cp."productId"
          WHERE cp."comboId" = $1::bigint
          ORDER BY cp.id`,
        [c.id],
      );
      items.forEach((i) => console.log(`        · ${i.quantity}x ${i.name || '(producto borrado)'}`));
    }
    const versions = await q(
      `SELECT id::text, name FROM combos WHERE "parentComboId" = ANY($1::bigint[]) ORDER BY id`,
      [args.comboIds],
    );
    if (versions.length) {
      console.log(`    ⚠ arrastra ${versions.length} versión(es) hija(s) (ON DELETE CASCADE):`);
      versions.forEach((v) => console.log(`        #${v.id} "${v.name}"`));
    }
    const missing = args.comboIds.filter((id) => !combos.some((c) => c.id === id));
    if (missing.length) console.log(`    ⚠ ids inexistentes: ${missing.join(', ')}`);
    console.log('    ⚠ Borra el combo, NO los productos que contiene.');
  }

  if (!args.apply) {
    console.log('\nDRY-RUN terminado. Nada fue borrado. Repite con --apply para ejecutar.');
    await client.end();
    return;
  }

  // ------------------------------------------------------- respaldo en JSON
  // Red de seguridad cuando no hay pg_dump a mano: guarda las filas que van a
  // desaparecer, para poder reconstruirlas si se borró de más.
  if (args.backupJson) {
    const dump = {
      generadoEn: new Date().toISOString(),
      db: `${process.env.DB_NAME}@${process.env.DB_HOST}`,
      usuarios: doomedUserIds.length
        ? await q(`SELECT * FROM users WHERE id = ANY($1::bigint[])`, [doomedUserIds])
        : [],
      ordenes: doomedOrderIds.length
        ? await q(`SELECT * FROM orders WHERE id = ANY($1::bigint[])`, [doomedOrderIds])
        : [],
      orderItems: doomedOrderIds.length
        ? await q(`SELECT * FROM order_items WHERE "orderId" = ANY($1::bigint[])`, [doomedOrderIds])
        : [],
      orderStatusHistory: doomedOrderIds.length
        ? await q(`SELECT * FROM order_status_history WHERE "orderId" = ANY($1::bigint[])`, [
            doomedOrderIds,
          ])
        : [],
      productos: args.productIds.length
        ? await q(`SELECT * FROM products WHERE id = ANY($1::bigint[])`, [args.productIds])
        : [],
      combos: args.comboIds.length
        ? await q(`SELECT * FROM combos WHERE id = ANY($1::bigint[])`, [args.comboIds])
        : [],
      comboProducts: args.comboIds.length
        ? await q(`SELECT * FROM combo_products WHERE "comboId" = ANY($1::bigint[])`, [args.comboIds])
        : [],
    };
    require('fs').writeFileSync(args.backupJson, JSON.stringify(dump, null, 2), 'utf8');
    const bytes = require('fs').statSync(args.backupJson).size;
    console.log(
      `\n>> Respaldo JSON: ${args.backupJson} (${Math.round(bytes / 1024)} KB) — ` +
        `${dump.usuarios.length} usuarios, ${dump.ordenes.length} órdenes, ${dump.orderItems.length} items`,
    );
    if (bytes < 512) {
      throw new Error('El respaldo salió vacío. Abortado, no se borró nada.');
    }
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

    if (args.comboIds.length) {
      // combo_products y las versiones hijas caen por CASCADE; se borran
      // explícito igual para que el conteo quede en el log.
      await del(
        'combo_products del combo',
        `DELETE FROM combo_products
          WHERE "comboId" = ANY($1::bigint[])
             OR "comboId" IN (SELECT id FROM combos WHERE "parentComboId" = ANY($1::bigint[]))`,
        [args.comboIds],
      );
      await del(
        'combos (versiones hijas)',
        `DELETE FROM combos WHERE "parentComboId" = ANY($1::bigint[])`,
        [args.comboIds],
      );
      await del('combos', `DELETE FROM combos WHERE id = ANY($1::bigint[])`, [args.comboIds]);
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
