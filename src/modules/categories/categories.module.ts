import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { Marca } from './entities/marca.entity';
import { Product } from '../products/entities/product.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Marca, Product])],
  controllers: [CategoriesController],
  providers: [CategoriesService, CloudinaryService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
