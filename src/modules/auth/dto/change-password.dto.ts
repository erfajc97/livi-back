import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Nd-AB12CD34', description: 'Contraseña actual' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'nuevaClave123', description: 'Nueva contraseña (mín. 8 caracteres)', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
