import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getVerificationEmailHtml } from './templates/verification-email';
import { getPasswordResetEmailHtml } from './templates/password-reset-email';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly frontendUrl: string;
  private sgMail: any = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey && !apiKey.includes('your-sendgrid')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sg = require('@sendgrid/mail');
        sg.setApiKey(apiKey);
        this.sgMail = sg;
        this.logger.log('SendGrid configured successfully');
      } catch (error) {
        this.logger.warn('SendGrid not available, emails will be logged only');
      }
    } else {
      this.logger.warn(
        'SENDGRID_API_KEY not configured, emails will be logged only',
      );
    }
    this.fromEmail =
      this.configService.get<string>('SENDGRID_FROM_EMAIL') ||
      'noreply@nondecants.com';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:4321';
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verificar-email?token=${token}`;

    if (!this.sgMail) {
      this.logger.log(
        `[DEV] Verification email for ${email}: ${verificationUrl}`,
      );
      return;
    }

    try {
      await this.sgMail.send({
        to: email,
        from: { email: this.fromEmail, name: 'NönDecants' },
        subject: 'Verifica tu email — NönDecants',
        html: getVerificationEmailHtml(firstName, verificationUrl),
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error,
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.frontendUrl}/restablecer-contrasena?token=${token}`;

    if (!this.sgMail) {
      this.logger.log(`[DEV] Password reset email for ${email}: ${resetUrl}`);
      return;
    }

    try {
      await this.sgMail.send({
        to: email,
        from: { email: this.fromEmail, name: 'NönDecants' },
        subject: 'Restablecer contraseña — NönDecants',
        html: getPasswordResetEmailHtml(firstName, resetUrl),
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
    }
  }
}
