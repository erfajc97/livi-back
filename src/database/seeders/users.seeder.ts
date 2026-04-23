import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../common/constants/roles.enum';
import * as bcrypt from 'bcrypt';

export class UsersSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Skip if any admin user already exists
    const existingAdmin = await userRepository.findOne({ where: { role: Role.ADMIN } });
    if (existingAdmin) {
      console.log('  - Admin user already exists, skipping');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin12345', 10);

    await userRepository.save({
      email: 'nondecantsadmin@gmail.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'NönDecants',
      role: Role.ADMIN,
      isActive: true,
      isEmailVerified: true,
    });

    console.log('✓ Admin user seeded');
    console.log('  - Email: nondecantsadmin@gmail.com');
    console.log('  - Password: admin12345');
  }
}
