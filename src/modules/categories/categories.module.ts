import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { Marca } from './entities/marca.entity';
import { Product } from '../products/entities/product.entity';
import { S3Service } from '../../common/services/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Marca, Product])],
  controllers: [CategoriesController],
  providers: [CategoriesService, S3Service],
  exports: [CategoriesService],
})
export class CategoriesModule {}
