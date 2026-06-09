import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Role } from '../../common/constants/roles.enum';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      // Seguridad: el registro público NUNCA asigna rol desde el cliente
      // (evita escalada a ADMIN). Para crear/promover admins, un admin
      // existente usa PATCH /users/:id (ruta protegida @Roles(ADMIN)).
      role: Role.CLIENT,
    });

    const savedUser = await this.usersRepository.save(user);
    return new UserResponseDto(savedUser);
  }

  async createForRegistration(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.usersRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: Role.CLIENT,
      isEmailVerified: false,
      authProvider: 'local',
    });

    return this.usersRepository.save(user);
  }

  async createGoogleUser(data: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = this.usersRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: Role.CLIENT,
      isEmailVerified: true,
      authProvider: 'google',
    });

    return this.usersRepository.save(user);
  }

  async setVerificationToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    await this.usersRepository.update(userId, {
      emailVerificationToken: token,
      emailVerificationTokenExpiry: expiry,
    });

    return token;
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    if (
      user.emailVerificationTokenExpiry &&
      user.emailVerificationTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Token inválido o expirado');
    }

    await this.usersRepository.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    });
  }

  async markEmailVerified(userId: number): Promise<void> {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    });
  }

  async setPasswordResetToken(
    email: string,
  ): Promise<{ token: string; user: User } | null> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user || user.authProvider === 'google') {
      return null;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await this.usersRepository.update(user.id, {
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: expiry,
    });

    return { token: rawToken, user };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.usersRepository.findOne({
      where: { passwordResetToken: hashedToken },
    });

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    if (
      user.passwordResetTokenExpiry &&
      user.passwordResetTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    });
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({ order: { createdAt: 'DESC' } });
    return users.map((user) => new UserResponseDto(user));
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return new UserResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);
    return new UserResponseDto(updatedUser);
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.usersRepository.remove(user);
  }
}
