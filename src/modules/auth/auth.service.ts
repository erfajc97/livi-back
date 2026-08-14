import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private dataSource: DataSource,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  /**
   * Vincula órdenes guest (userId NULL) cuyo customerEmail coincide con el
   * email del usuario que inicia sesión. Fire-and-forget: no bloquea ni
   * rompe el login si falla. La query se apoya en un índice parcial funcional
   * sobre LOWER(customerEmail) WHERE userId IS NULL, así que solo escanea
   * órdenes huérfanas (barato aunque corra en cada login).
   */
  private async linkGuestOrders(userId: number, email: string): Promise<void> {
    if (!email) return;
    try {
      await this.dataSource.query(
        `UPDATE "orders" SET "userId" = $1
         WHERE "userId" IS NULL AND LOWER("customerEmail") = LOWER($2)`,
        [userId, email],
      );
    } catch {
      // best-effort — el login no debe fallar por esto
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Reclama cualquier orden guest previa hecha con este email.
    await this.linkGuestOrders(user.id, user.email);

    const payload = { email: user.email, sub: user.id };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const user = await this.usersService.createForRegistration({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    const token = await this.usersService.setVerificationToken(user.id);
    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      token,
    );

    return {
      message:
        'Registro exitoso. Revisa tu email para verificar tu cuenta.',
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.verifyEmail(token);

    // Reclama cualquier orden guest previa hecha con este email.
    await this.linkGuestOrders(user.id, user.email);

    // M-10 · La cuenta recién queda utilizable acá, no al registrarse: este es
    // el momento de darle la bienvenida. En segundo plano, como el resto.
    this.emailService
      .sendWelcomeEmail(user.email, user.firstName)
      .catch((err) => console.error('[Auth] M-10 bienvenida falló:', err?.message));

    return {
      message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (user && !user.isEmailVerified) {
      const token = await this.usersService.setVerificationToken(user.id);
      await this.emailService.sendVerificationEmail(
        user.email,
        user.firstName,
        token,
      );
    }

    return {
      message:
        'Si el email está registrado, recibirás un enlace de verificación.',
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const result = await this.usersService.setPasswordResetToken(email);

    if (result.outcome === 'token') {
      await this.emailService.sendPasswordResetEmail(
        result.user.email,
        result.user.firstName,
        result.token,
      );
    } else if (result.outcome === 'google') {
      // La cuenta entra con Google: no hay contraseña que cambiar, pero el
      // silencio se lee como "el correo no llegó". Se avisa por correo, que
      // solo ve el dueño de la cuenta.
      await this.emailService.sendPasswordResetGoogleNotice(
        result.user.email,
        result.user.firstName,
      );
    }

    // La respuesta no distingue los tres casos: decir "ese email no existe"
    // permitiría averiguar quién tiene cuenta.
    return {
      message:
        'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    await this.usersService.resetPassword(token, newPassword);
    return { message: 'Contraseña restablecida exitosamente.' };
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Contraseña actualizada exitosamente.' };
  }

  async googleLogin(idToken: string): Promise<AuthResponseDto> {
    let payload: any;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch {
      throw new BadRequestException('Token de Google inválido');
    }

    if (!payload || !payload.email) {
      throw new BadRequestException('Token de Google inválido');
    }

    const email = payload.email;
    const firstName = payload.given_name || 'Usuario';
    const lastName = payload.family_name || '';

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.createGoogleUser({
        email,
        firstName,
        lastName,
      });
    } else if (!user.isEmailVerified) {
      await this.usersService.markEmailVerified(user.id);
      user.isEmailVerified = true;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Reclama cualquier orden guest previa hecha con este email.
    await this.linkGuestOrders(user.id, user.email);

    const jwtPayload = { email: user.email, sub: user.id };

    return {
      accessToken: this.jwtService.sign(jwtPayload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  generateToken(user: any): string {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
