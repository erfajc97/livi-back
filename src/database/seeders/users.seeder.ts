import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../common/constants/roles.enum';
import * as bcrypt from 'bcrypt';

export class UsersSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Clear existing users (optional - comment out if you want to keep existing users)
    const existingUsers = await userRepository.find();
    if (existingUsers.length > 0) {
      console.log(`  - Found ${existingUsers.length} existing users, skipping seeder`);
      return;
    }

    // Hash password for all users (using a common password for seed data)
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create Admin Users
    const admin1 = await userRepository.save({
      email: 'admin1@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'One',
      role: Role.ADMIN,
      isActive: true,
    });

    const admin2 = await userRepository.save({
      email: 'admin2@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Two',
      role: Role.ADMIN,
      isActive: true,
    });

    // Create Client Users
    const clients = [
      {
        email: 'client1@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        email: 'client2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      {
        email: 'client3@example.com',
        firstName: 'Michael',
        lastName: 'Johnson',
      },
      {
        email: 'client4@example.com',
        firstName: 'Emily',
        lastName: 'Williams',
      },
      {
        email: 'client5@example.com',
        firstName: 'David',
        lastName: 'Brown',
      },
      {
        email: 'client6@example.com',
        firstName: 'Sarah',
        lastName: 'Davis',
      },
      {
        email: 'client7@example.com',
        firstName: 'Robert',
        lastName: 'Miller',
      },
      {
        email: 'client8@example.com',
        firstName: 'Jessica',
        lastName: 'Wilson',
      },
      {
        email: 'client9@example.com',
        firstName: 'William',
        lastName: 'Moore',
      },
      {
        email: 'client10@example.com',
        firstName: 'Amanda',
        lastName: 'Taylor',
      },
    ];

    const clientUsers = await Promise.all(
      clients.map((client) =>
        userRepository.save({
          email: client.email,
          password: hashedPassword,
          firstName: client.firstName,
          lastName: client.lastName,
          role: Role.CLIENT,
          isActive: true,
        }),
      ),
    );

    console.log('✓ Users seeded');
    console.log(`  - Created 2 admin users`);
    console.log(`  - Created 10 client users`);
    console.log(`  - Default password for all users: ${defaultPassword}`);
    console.log(`  - Total users: ${await userRepository.count()}`);
  }
}