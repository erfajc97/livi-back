import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/constants/roles.enum';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({
    example: {
      id: 1,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.CLIENT,
      isEmailVerified: false,
    },
    description: 'User information',
  })
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isEmailVerified: boolean;
  };
}
