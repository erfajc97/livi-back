import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Confirmación explícita para el borrado masivo de órdenes: obliga al cliente
 * a mandar la palabra completa, así ningún DELETE accidental vacía la tabla.
 */
export class ResetOrdersDto {
  @ApiProperty({ example: 'RESET', description: 'Debe ser exactamente "RESET"' })
  @IsString()
  confirm: string;
}
