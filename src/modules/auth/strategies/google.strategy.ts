import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../../common/constants/roles.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, name } = profile;
    const email = emails[0].value;
    const firstName = name.givenName || 'User';
    const lastName = name.familyName || '';

    try {
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        // Create new user from Google profile
        // Generate a random password for Google users (they won't use it)
        const randomPassword = Math.random().toString(36).slice(-12);
        const createdUserDto = await this.usersService.create({
          email,
          firstName,
          lastName,
          password: randomPassword,
          role: Role.CLIENT,
        });

        // Convert UserResponseDto to user object for Passport
        user = {
          id: createdUserDto.id,
          email: createdUserDto.email,
          firstName: createdUserDto.firstName,
          lastName: createdUserDto.lastName,
          role: createdUserDto.role,
        } as any;
      }

      if (!user) {
        return done(new Error('Failed to create or find user'));
      }

      return done(null, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      done(error);
    }
  }
}
