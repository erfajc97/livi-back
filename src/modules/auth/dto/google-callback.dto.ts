import { ApiProperty } from '@nestjs/swagger';

export class GoogleCallbackDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({
    example: {
      id: 1,
      email: 'user@gmail.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'client',
    },
    description: 'User information',
  })
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}
