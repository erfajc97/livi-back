import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariationImage } from './entities/product-variation-image.entity';
import { ProductVariation } from './entities/product-variation.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImageResponseDto } from './dto/product-image-response.dto';

@Injectable()
export class ProductVariationImagesService {
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor(
    @InjectRepository(ProductVariationImage)
    private variationImagesRepository: Repository<ProductVariationImage>,
    @InjectRepository(ProductVariation)
    private variationsRepository: Repository<ProductVariation>,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Upload images for a product variation
   */
  async uploadImages(
    variationId: number,
    files: Express.Multer.File[],
  ): Promise<ProductImageResponseDto[]> {
    // Verify variation exists
    const variation = await this.variationsRepository.findOne({ where: { id: variationId } });
    if (!variation) {
      throw new NotFoundException(`Product variation with ID ${variationId} not found`);
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Upload files to S3
    const uploadResults = await this.cloudinaryService.uploadFiles(
      files,
      `product-variations/${variationId}/images`,
      this.ALLOWED_IMAGE_TYPES,
    );

    // El orden continúa desde la última imagen de la variante: si cada subida
    // vuelve a empezar en cero, las nuevas empatan con las viejas y el orden lo
    // decide la base.
    const lastOrder = await this.variationImagesRepository
      .createQueryBuilder('img')
      .select('MAX(img."displayOrder")', 'max')
      .where('img."variationId" = :variationId', { variationId })
      .getRawOne<{ max: number | null }>();
    const startOrder = Number(lastOrder?.max ?? -1) + 1;

    const images = uploadResults.map((result, index) => {
      return this.variationImagesRepository.create({
        variationId,
        url: result.url,
        key: result.key,
        displayOrder: startOrder + index,
      });
    });

    const savedImages = await this.variationImagesRepository.save(images);
    return savedImages.map((image) => new ProductImageResponseDto(image));
  }

  /**
   * Get all images for a product variation
   */
  async findAll(variationId: number): Promise<ProductImageResponseDto[]> {
    const images = await this.variationImagesRepository.find({
      where: { variationId },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });

    return images.map((image) => new ProductImageResponseDto(image));
  }

  /**
   * Get a single image
   */
  async findOne(id: number): Promise<ProductImageResponseDto> {
    const image = await this.variationImagesRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Product variation image with ID ${id} not found`);
    }

    return new ProductImageResponseDto(image);
  }

  /**
   * Update an image
   */
  async update(id: number, updateDto: UpdateProductImageDto): Promise<ProductImageResponseDto> {
    const image = await this.variationImagesRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Product variation image with ID ${id} not found`);
    }

    Object.assign(image, updateDto);
    const updatedImage = await this.variationImagesRepository.save(image);
    return new ProductImageResponseDto(updatedImage);
  }

  /**
   * Delete an image
   */
  async remove(id: number): Promise<void> {
    const image = await this.variationImagesRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Product variation image with ID ${id} not found`);
    }

    // Delete from S3
    await this.cloudinaryService.deleteFile(image.key);

    // Delete from database
    await this.variationImagesRepository.remove(image);
  }

  /**
   * Delete multiple images
   */
  async removeMultiple(ids: number[]): Promise<void> {
    const images = await this.variationImagesRepository.find({
      where: ids.map((id) => ({ id })),
    });

    if (images.length === 0) {
      return;
    }

    // Delete from S3
    const keys = images.map((image) => image.key);
    await this.cloudinaryService.deleteFiles(keys);

    // Delete from database
    await this.variationImagesRepository.remove(images);
  }
}
