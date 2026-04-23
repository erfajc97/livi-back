import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/constants/roles.enum';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  lastName: string;

  @ApiProperty({ example: Role.CLIENT, description: 'User role', enum: Role })
  role: Role;

  @ApiProperty({ example: true, description: 'User active status' })
  isActive: boolean;

  @ApiProperty({ required: false })
  isEmailVerified: boolean;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  cedula?: string;

  @ApiProperty({ required: false })
  province?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  reference?: string;

  @ApiProperty({ required: false })
  preferredDeliveryMethod?: string;

  @ApiProperty({ description: 'Auth provider (local, google)' })
  authProvider: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  constructor(user: any) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.role = user.role;
    this.isActive = user.isActive;
    this.isEmailVerified = user.isEmailVerified ?? false;
    this.phone = user.phone;
    this.cedula = user.cedula;
    this.province = user.province;
    this.city = user.city;
    this.address = user.address;
    this.reference = user.reference;
    this.preferredDeliveryMethod = user.preferredDeliveryMethod;
    this.authProvider = user.authProvider ?? 'local';
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
