import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVideo } from './entities/product-video.entity';
import { Product } from './entities/product.entity';
import { S3Service } from '../../common/services/s3.service';
import { UpdateProductVideoDto } from './dto/update-product-video.dto';
import { ProductVideoResponseDto } from './dto/product-video-response.dto';

@Injectable()
export class ProductVideosService {
  private readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ];

  constructor(
    @InjectRepository(ProductVideo)
    private productVideosRepository: Repository<ProductVideo>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private s3Service: S3Service,
  ) {}

  /**
   * Upload videos for a product
   */
  async uploadVideos(
    productId: number,
    files: Express.Multer.File[],
  ): Promise<ProductVideoResponseDto[]> {
    // Verify product exists
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Upload files to S3
    const uploadResults = await this.s3Service.uploadFiles(
      files,
      `products/${productId}/videos`,
      this.ALLOWED_VIDEO_TYPES,
    );

    // Save video records to database
    const videos = uploadResults.map((result, index) => {
      return this.productVideosRepository.create({
        productId,
        url: result.url,
        key: result.key,
        displayOrder: index,
      });
    });

    const savedVideos = await this.productVideosRepository.save(videos);
    return savedVideos.map((video) => new ProductVideoResponseDto(video));
  }

  /**
   * Get all videos for a product
   */
  async findAll(productId: number): Promise<ProductVideoResponseDto[]> {
    const videos = await this.productVideosRepository.find({
      where: { productId },
      order: { displayOrder: 'ASC' },
    });

    return videos.map((video) => new ProductVideoResponseDto(video));
  }

  /**
   * Get a single video
   */
  async findOne(id: number): Promise<ProductVideoResponseDto> {
    const video = await this.productVideosRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Product video with ID ${id} not found`);
    }

    return new ProductVideoResponseDto(video);
  }

  /**
   * Update a video
   */
  async update(id: number, updateDto: UpdateProductVideoDto): Promise<ProductVideoResponseDto> {
    const video = await this.productVideosRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Product video with ID ${id} not found`);
    }

    Object.assign(video, updateDto);
    const updatedVideo = await this.productVideosRepository.save(video);
    return new ProductVideoResponseDto(updatedVideo);
  }

  /**
   * Delete a video
   */
  async remove(id: number): Promise<void> {
    const video = await this.productVideosRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Product video with ID ${id} not found`);
    }

    // Delete from S3
    await this.s3Service.deleteFile(video.key);

    // Delete from database
    await this.productVideosRepository.remove(video);
  }

  /**
   * Delete multiple videos
   */
  async removeMultiple(ids: number[]): Promise<void> {
    const videos = await this.productVideosRepository.find({
      where: ids.map((id) => ({ id })),
    });

    if (videos.length === 0) {
      return;
    }

    // Delete from S3
    const keys = videos.map((video) => video.key);
    await this.s3Service.deleteFiles(keys);

    // Delete from database
    await this.productVideosRepository.remove(videos);
  }
}
