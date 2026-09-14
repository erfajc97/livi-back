import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CombosService } from './combos.service';
import { CombosController } from './combos.controller';
import { Combo } from './entities/combo.entity';
import { ComboProduct } from './entities/combo-product.entity';
import { Product } from '../products/entities/product.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Combo, ComboProduct, Product])],
  controllers: [CombosController],
  providers: [CombosService, CloudinaryService],
  exports: [CombosService],
})
export class CombosModule {}
