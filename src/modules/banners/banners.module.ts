import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersService } from './banners.service';
import { BannerEnumService } from './banner-enum.service';
import { BannersController } from './banners.controller';
import { Banner } from './entities/banner.entity';
import { S3Service } from '../../common/services/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  controllers: [BannersController],
  providers: [BannersService, BannerEnumService, S3Service],
  exports: [BannersService],
})
export class BannersModule {}
