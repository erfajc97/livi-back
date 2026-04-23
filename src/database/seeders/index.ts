import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { CategoriesSeeder } from './categories.seeder';
import { ProductOptionsSeeder } from './product-options.seeder';
import { ProductsSeeder } from './products.seeder';
import { DecantsSeeder } from './decants.seeder';
import { ProductVariationsSeeder } from './product-variations.seeder';
import { UsersSeeder } from './users.seeder';
import { BannersSeeder } from './banners.seeder';
import { CombosSeeder } from './combos.seeder';
// import { OrdersSeeder } from './orders.seeder'; // Disabled — orders are now real
import { FinanceSeeder } from './finance.seeder';
import { ProductFilterFieldsSeeder } from './product-filter-fields.seeder';
import { ProductImagesSeeder } from './product-images.seeder';
import { entities } from '../../config/entities';

// Reload environment variables to ensure fresh credentials
config();

export const seeders = [
  UsersSeeder,
  CategoriesSeeder,
  ProductOptionsSeeder,
  ProductsSeeder,
  DecantsSeeder,
  ProductVariationsSeeder,
  ProductFilterFieldsSeeder,
  ProductImagesSeeder,
  BannersSeeder,
  CombosSeeder,
  // OrdersSeeder,
  FinanceSeeder,
];

export async function runSeeders() {
  // Create a fresh DataSource with current environment variables
  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ecommerce',
    entities: entities, // Use centralized entities to avoid Node.js experimental TypeScript issues
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
  };

  const dataSource = new DataSource(dataSourceOptions);

  try {
    console.log(`🔌 Connecting to database: ${dataSourceOptions.host}:${dataSourceOptions.port}/${dataSourceOptions.database} as ${dataSourceOptions.username}`);
    await dataSource.initialize();
    console.log('🌱 Starting database seeding...\n');

    for (const SeederClass of seeders) {
      const seeder = new SeederClass();
      await seeder.run(dataSource);
      console.log('');
    }

    console.log('✅ All seeders completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run seeders if this file is executed directly
if (require.main === module) {
  runSeeders()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
