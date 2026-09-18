import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  lastName: string;

  // El formulario de registro pide teléfono: sin este campo el dato se
  // perdía (y enviarlo daba 400 por forbidNonWhitelisted).
  @ApiProperty({ example: '0999999999', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'phone debe tener exactamente 10 dígitos',
  })
  phone?: string;
}
