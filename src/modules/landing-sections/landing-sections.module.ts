import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandingSectionsService } from './landing-sections.service';
import { LandingSectionsController } from './landing-sections.controller';
import { LandingSection } from './entities/landing-section.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandingSection, Product])],
  controllers: [LandingSectionsController],
  providers: [LandingSectionsService],
  exports: [LandingSectionsService],
})
export class LandingSectionsModule {}
