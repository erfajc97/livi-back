import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { entities } from './entities';
import { envFlag } from './env-flag';

// Ensure .env is loaded (same as data-source.ts)
config();

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    // For OpenAPI export, use minimal config with timeout
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      return {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'ecommerce',
        entities,
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: false,
        ssl: false,
        connectTimeoutMS: 1000,
        retryAttempts: 0,
        retryDelay: 0,
      } as TypeOrmModuleOptions;
    }

    // Postgres gestionado (Render/Neon/Supabase) entrega una sola URL de
    // conexión: si está, manda sobre las DB_* sueltas. Así el dashboard puede
    // inyectar la credencial completa sin copiarla a mano.
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    const ssl = envFlag(this.configService.get('DB_SSL'), false)
      ? { rejectUnauthorized: false }
      : false;

    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
        entities,
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        synchronize: envFlag(this.configService.get('DB_SYNCHRONIZE'), false),
        migrationsRun: envFlag(
          this.configService.get('DB_MIGRATIONS_RUN'),
          false,
        ),
        logging: envFlag(this.configService.get('DB_LOGGING'), false),
        ssl,
      };
    }

    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_NAME', 'ecommerce'),
      entities, // Use centralized entities to avoid Node.js experimental TypeScript issues
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: envFlag(this.configService.get('DB_SYNCHRONIZE'), false),
      // NUNCA default true: staging/prod se armó con synchronize, no con el
      // historial de migrations. Si TypeORM corre CreateUsersTable sobre una
      // base que ya tiene `users`, el proceso muere al boot y todo da 500.
      migrationsRun: envFlag(this.configService.get('DB_MIGRATIONS_RUN'), false),
      logging: envFlag(this.configService.get('DB_LOGGING'), false),
      // Postgres gestionado (Render) exige SSL con certificado que node no
      // siempre valida: se cifra la conexión sin verificar la CA.
      ssl,
    };
  }
}
