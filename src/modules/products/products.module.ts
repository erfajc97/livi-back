import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductOptionsService } from './product-options.service';
import { ProductOptionsController } from './product-options.controller';
import { ProductVariationsService } from './product-variations.service';
import { ProductVariationsController } from './product-variations.controller';
import { ProductImagesService } from './product-images.service';
import { ProductImagesController } from './product-images.controller';
import { ProductVideosService } from './product-videos.service';
import { ProductVideosController } from './product-videos.controller';
import { ProductVariationImagesService } from './product-variation-images.service';
import { ProductVariationImagesController } from './product-variation-images.controller';
import { ProductVariationVideosService } from './product-variation-videos.service';
import { ProductVariationVideosController } from './product-variation-videos.controller';
import { UploadsController } from './uploads.controller';
import { StockService } from './stock.service';
import { S3Service } from '../../common/services/s3.service';
import { Product } from './entities/product.entity';
import { ProductOption } from './entities/product-option.entity';
import { ProductOptionValue } from './entities/product-option-value.entity';
import { ProductVariation } from './entities/product-variation.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVideo } from './entities/product-video.entity';
import { ProductVariationImage } from './entities/product-variation-image.entity';
import { ProductVariationVideo } from './entities/product-variation-video.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductOption,
      ProductOptionValue,
      ProductVariation,
      ProductImage,
      ProductVideo,
      ProductVariationImage,
      ProductVariationVideo,
    ]),
  ],
  controllers: [
    ProductsController,
    ProductOptionsController,
    ProductVariationsController,
    ProductImagesController,
    ProductVideosController,
    ProductVariationImagesController,
    ProductVariationVideosController,
    UploadsController,
  ],
  providers: [
    ProductsService,
    ProductOptionsService,
    ProductVariationsService,
    ProductImagesService,
    ProductVideosService,
    ProductVariationImagesService,
    ProductVariationVideosService,
    StockService,
    S3Service,
  ],
  exports: [
    ProductsService,
    StockService,
    ProductOptionsService,
    ProductVariationsService,
    ProductImagesService,
    ProductVideosService,
    ProductVariationImagesService,
    ProductVariationVideosService,
  ],
})
export class ProductsModule {}
