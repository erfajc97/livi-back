import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({
    example: 'Casa',
    description: 'Alias para identificar la dirección (Casa, Oficina, ...)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  alias: string;

  @ApiProperty({ example: 'Guayas', description: 'Provincia de entrega' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provincia: string;

  @ApiProperty({ example: 'Guayaquil', description: 'Ciudad de entrega' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ciudad: string;

  @ApiProperty({
    example: 'Av. Principal 123 y Calle Secundaria',
    description: 'Dirección exacta de entrega',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion: string;

  @ApiPropertyOptional({
    example: 'Frente al parque, portón negro',
    description: 'Referencia para ubicar la dirección',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  referencia?: string;

  @ApiProperty({
    example: '0992305463',
    description: 'Teléfono de contacto para la entrega',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telefono: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Marcar como dirección predeterminada (desmarca las demás)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
