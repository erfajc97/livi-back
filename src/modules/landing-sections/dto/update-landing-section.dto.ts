import { PartialType } from '@nestjs/swagger';
import { CreateLandingSectionDto } from './create-landing-section.dto';

export class UpdateLandingSectionDto extends PartialType(CreateLandingSectionDto) {}
