import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../common/constants/roles.enum';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'tkfili25@gmail.com';
const ADMIN_PASSWORD = 'admin12345@@2026';

export class UsersSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Skip if any admin user already exists
    const existingAdmin = await userRepository.findOne({ where: { role: Role.ADMIN } });
    if (existingAdmin) {
      console.log('  - Admin user already exists, skipping');
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await userRepository.save({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'LIVI',
      role: Role.ADMIN,
      isActive: true,
      isEmailVerified: true,
    });

    console.log('✓ Admin user seeded');
    console.log(`  - Email: ${ADMIN_EMAIL}`);
    console.log(`  - Password: ${ADMIN_PASSWORD}`);
  }
}
