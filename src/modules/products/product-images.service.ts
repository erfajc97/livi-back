import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { S3Service } from '../../common/services/s3.service';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImageResponseDto } from './dto/product-image-response.dto';

@Injectable()
export class ProductImagesService {
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor(
    @InjectRepository(ProductImage)
    private productImagesRepository: Repository<ProductImage>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private s3Service: S3Service,
  ) {}

  /**
   * Upload images for a product
   */
  async uploadImages(
    productId: number,
    files: Express.Multer.File[],
  ): Promise<ProductImageResponseDto[]> {
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
      `products/${productId}/images`,
      this.ALLOWED_IMAGE_TYPES,
    );

    // El orden continúa desde la última imagen del producto. Antes cada subida
    // empezaba de cero, así que al agregar una foto suelta quedaba empatada con
    // la principal y el orden lo terminaba decidiendo la base: por eso a veces
    // la segunda imagen aparecía primera.
    const lastOrder = await this.productImagesRepository
      .createQueryBuilder('img')
      .select('MAX(img."displayOrder")', 'max')
      .where('img."productId" = :productId', { productId })
      .getRawOne<{ max: number | null }>();
    const startOrder = Number(lastOrder?.max ?? -1) + 1;

    const images = uploadResults.map((result, index) => {
      return this.productImagesRepository.create({
        productId,
        url: result.url,
        key: result.key,
        displayOrder: startOrder + index,
      });
    });

    const savedImages = await this.productImagesRepository.save(images);
    return savedImages.map((image) => new ProductImageResponseDto(image));
  }

  /**
   * Sube la imagen de "La firma" (PDP) a S3 y la guarda en product.signatureImageUrl.
   * No crea registro en product_images (no es parte de la galería).
   */
  async uploadSignatureImage(
    productId: number,
    file: Express.Multer.File,
  ): Promise<{ signatureImageUrl: string }> {
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const [result] = await this.s3Service.uploadFiles(
      [file],
      `products/${productId}/signature`,
      this.ALLOWED_IMAGE_TYPES,
    );
    product.signatureImageUrl = result.url;
    await this.productsRepository.save(product);
    return { signatureImageUrl: result.url };
  }

  /**
   * Get all images for a product
   */
  async findAll(productId: number): Promise<ProductImageResponseDto[]> {
    const images = await this.productImagesRepository.find({
      where: { productId },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });

    return images.map((image) => new ProductImageResponseDto(image));
  }

  /**
   * Get a single image
   */
  async findOne(id: number): Promise<ProductImageResponseDto> {
    const image = await this.productImagesRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Product image with ID ${id} not found`);
    }

    return new ProductImageResponseDto(image);
  }

  /**
   * Update an image
   */
  async update(id: number, updateDto: UpdateProductImageDto): Promise<ProductImageResponseDto> {
    const image = await this.productImagesRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Product image with ID ${id} not found`);
    }

    Object.assign(image, updateDto);
    const updatedImage = await this.productImagesRepository.save(image);
    return new ProductImageResponseDto(updatedImage);
  }

  /**
   * Delete an image
   */
  async remove(id: number): Promise<void> {
    const image = await this.productImagesRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Product image with ID ${id} not found`);
    }

    // Delete from S3
    await this.s3Service.deleteFile(image.key);

    // Delete from database
    await this.productImagesRepository.remove(image);
  }

  /**
   * Delete multiple images
   */
  async removeMultiple(ids: number[]): Promise<void> {
    const images = await this.productImagesRepository.find({
      where: ids.map((id) => ({ id })),
    });

    if (images.length === 0) {
      return;
    }

    // Delete from S3
    const keys = images.map((image) => image.key);
    await this.s3Service.deleteFiles(keys);

    // Delete from database
    await this.productImagesRepository.remove(images);
  }
}
