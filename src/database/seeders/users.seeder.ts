import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../common/constants/roles.enum';
import * as bcrypt from 'bcrypt';

// Login password is intentionally hardcoded — admin only changes via DB reset.
// Email is read from ADMIN_EMAIL env var so production can rotate the login
// account without rebuilding the image.
const DEFAULT_ADMIN_EMAIL = 'tkfili25@gmail.com';
const ADMIN_PASSWORD = 'admin12345@@2026';

export class UsersSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    const adminEmail = process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL;

    // Skip if any admin user already exists
    const existingAdmin = await userRepository.findOne({ where: { role: Role.ADMIN } });
    if (existingAdmin) {
      console.log('  - Admin user already exists, skipping');
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await userRepository.save({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'NönDecants',
      role: Role.ADMIN,
      isActive: true,
      isEmailVerified: true,
    });

    console.log('✓ Admin user seeded');
    console.log(`  - Email: ${adminEmail}`);
    console.log(`  - Password: ${ADMIN_PASSWORD}`);
  }
}
