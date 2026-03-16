import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
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
    await this.usersService.verifyEmail(token);
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

    if (result) {
      await this.emailService.sendPasswordResetEmail(
        result.user.email,
        result.user.firstName,
        result.token,
      );
    }

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
