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

  /**
   * Cuenta automática para guest checkout: se crea con una contraseña
   * temporal legible que se envía por email; el usuario la cambia cuando
   * quiera desde su perfil o con "olvidé mi contraseña".
   * Devuelve la contraseña en plano SOLO para poder enviarla por correo.
   */
  async createGuestAccount(data: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: User; plainPassword: string }> {
    const plainPassword = `Nd-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = this.usersRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: Role.CLIENT,
      isEmailVerified: false,
      authProvider: 'local',
    });

    return { user: await this.usersRepository.save(user), plainPassword };
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

  async verifyEmail(token: string): Promise<User> {
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

    return user;
  }

  async markEmailVerified(userId: number): Promise<void> {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    });
  }

  /**
   * Prepara el restablecimiento de contraseña.
   *
   * Devuelve el motivo cuando no hay token: una cuenta de Google no tiene
   * contraseña nuestra, y quien la pidió merece saberlo por correo en vez de
   * quedarse esperando un enlace que nunca sale.
   */
  async setPasswordResetToken(
    email: string,
  ): Promise<
    | { outcome: 'token'; token: string; user: User }
    | { outcome: 'google'; user: User }
    | { outcome: 'not_found' }
  > {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) return { outcome: 'not_found' };
    if (user.authProvider === 'google') return { outcome: 'google', user };

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

    return { outcome: 'token', token: rawToken, user };
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

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.authProvider === 'google') {
      throw new BadRequestException(
        'Tu cuenta usa Google — no tiene contraseña local',
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(userId, { password: hashedPassword });
  }

  /**
   * Restablecimiento hecho por un admin desde el panel: no pide la contraseña
   * actual (el admin no la tiene) y, si no le pasan una, genera una temporal
   * legible para poder dictarla o enviarla por correo.
   *
   * Devuelve la contraseña en plano porque el panel necesita mostrarla una
   * vez; después ya no hay forma de recuperarla.
   */
  async adminResetPassword(
    id: number,
    newPassword?: string,
  ): Promise<{ user: User; plainPassword: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Una cuenta de Google entra por Google: ponerle contraseña no le
    // devuelve el acceso y solo confunde a quien la usa.
    if (user.authProvider === 'google') {
      throw new BadRequestException(
        'Esta cuenta entra con Google — no tiene contraseña que restablecer',
      );
    }

    const plainPassword =
      newPassword || `Nd-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await this.usersRepository.update(id, {
      password: await bcrypt.hash(plainPassword, 10),
      // Un enlace de "olvidé mi contraseña" pendiente dejaría de tener
      // sentido tras el cambio: se invalida.
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    });

    return { user, plainPassword };
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

  /**
   * Borra un usuario aunque tenga historial.
   *
   * Las órdenes NO se borran: se desvinculan (userId → NULL) y quedan como
   * compra de invitado, con el nombre, correo y teléfono que ya guardan. Así
   * el admin puede sacar de la base a un cliente de prueba sin perder la venta
   * ni chocar contra la foreign key.
   *
   * Lo que sí se borra es lo que solo le sirve a ese usuario: su carrito, sus
   * direcciones y sus usos de cupón.
   */
  async remove(id: number): Promise<{ ordersUnlinked: number }> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.role === Role.ADMIN) {
      const admins = await this.usersRepository.count({ where: { role: Role.ADMIN } });
      if (admins <= 1) {
        throw new ConflictException(
          'No se puede eliminar el único administrador: quedarías sin acceso al panel.',
        );
      }
    }

    return this.usersRepository.manager.transaction(async (manager) => {
      const unlink = await manager.query('UPDATE orders SET "userId" = NULL WHERE "userId" = $1', [
        id,
      ]);
      const ordersUnlinked = Array.isArray(unlink) && typeof unlink[1] === 'number' ? unlink[1] : 0;

      await manager.query(
        'DELETE FROM cart_items WHERE "cartId" IN (SELECT id FROM carts WHERE "userId" = $1)',
        [id],
      );
      await manager.query('DELETE FROM carts WHERE "userId" = $1', [id]);
      await manager.query('DELETE FROM user_addresses WHERE "userId" = $1', [id]);
      await manager.query('DELETE FROM coupon_usages WHERE "userId" = $1', [id]);
      await manager.query('DELETE FROM users WHERE id = $1', [id]);

      return { ordersUnlinked };
    });
  }
}
