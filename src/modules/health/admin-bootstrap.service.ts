import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/constants/roles.enum';

/**
 * Crea el primer usuario ADMIN al arrancar si se definen ADMIN_SEED_EMAIL y
 * ADMIN_SEED_PASSWORD y todavía no existe ningún admin. Pensado para Render
 * free, que no tiene shell para correr `npm run seed:prod` a mano.
 * Tras el primer arranque se pueden borrar ambas variables.
 */
@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.configService.get<string>('ADMIN_SEED_EMAIL')?.trim();
    const password = this.configService.get<string>('ADMIN_SEED_PASSWORD');
    if (!email || !password) return;

    try {
      const users = this.dataSource.getRepository(User);
      const existingAdmin = await users.findOne({ where: { role: Role.ADMIN } });
      if (existingAdmin) return;

      await users.save({
        email: email.toLowerCase(),
        password: await bcrypt.hash(password, 10),
        firstName: 'Admin',
        lastName: 'LIVI',
        role: Role.ADMIN,
        isActive: true,
        isEmailVerified: true,
      });
      this.logger.log(`Usuario admin inicial creado: ${email}`);
    } catch (error) {
      this.logger.error(`No se pudo crear el admin inicial: ${(error as Error).message}`);
    }
  }
}
