import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

// DATABASE_URL (Postgres gestionado: Render, Neon, Supabase) manda sobre las
// DB_* sueltas: el dashboard inyecta la credencial completa en una variable.
const connection = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'ecommerce',
    };

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...connection,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
