import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersService } from './banners.service';
import { BannerEnumService } from './banner-enum.service';
import { BannersController } from './banners.controller';
import { Banner } from './entities/banner.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  controllers: [BannersController],
  providers: [BannersService, BannerEnumService, CloudinaryService],
  exports: [BannersService],
})
export class BannersModule {}
