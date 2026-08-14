import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @ApiPropertyOptional({
    description:
      'Contraseña nueva. Si se omite, el backend genera una temporal.',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @ApiPropertyOptional({
    description: 'Enviar la contraseña nueva al correo del usuario',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  notify?: boolean;
}
