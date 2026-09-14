import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Marca } from './entities/marca.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Product } from '../products/entities/product.entity';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { S3Service } from '../../common/services/s3.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Marca)
    private marcasRepository: Repository<Marca>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private s3Service: S3Service,
  ) {}

  // Category methods
  async createCategory(
    createCategoryDto: CreateCategoryDto,
    file?: Express.Multer.File,
    mobileFile?: Express.Multer.File,
  ): Promise<Category> {
    if (file) {
      const uploaded = await this.s3Service.uploadFile(file, 'categories');
      createCategoryDto.imageUrl = uploaded.url;
      createCategoryDto.imageKey = uploaded.key;
    }
    if (mobileFile) {
      const uploaded = await this.s3Service.uploadFile(mobileFile, 'categories');
      createCategoryDto.mobileImageUrl = uploaded.url;
      createCategoryDto.mobileImageKey = uploaded.key;
    }
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAllCategories(paginationDto?: PaginationDto): Promise<Category[] | PaginatedResponseDto<Category>> {
    const where: any = {};

    if (paginationDto && (paginationDto.page || paginationDto.limit)) {
      const { page = 1, limit = 20 } = paginationDto;
      const skip = (page - 1) * limit;

      const [categories, total] = await this.categoriesRepository.findAndCount({
        where,
        relations: ['marcas'],
        order: { name: 'ASC' },
        skip,
        take: limit,
      });

      return new PaginatedResponseDto(categories, total, page, limit);
    }

    return this.categoriesRepository.find({
      where,
      relations: ['marcas'],
      order: { name: 'ASC' },
    });
  }

  async findOneCategory(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['marcas'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    file?: Express.Multer.File,
    mobileFile?: Express.Multer.File,
  ): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (file) {
      if (category.imageKey) {
        await this.s3Service.deleteFile(category.imageKey);
      }
      const uploaded = await this.s3Service.uploadFile(file, 'categories');
      updateCategoryDto.imageUrl = uploaded.url;
      updateCategoryDto.imageKey = uploaded.key;
    }

    if (mobileFile) {
      if (category.mobileImageKey) {
        await this.s3Service.deleteFile(category.mobileImageKey);
      }
      const uploaded = await this.s3Service.uploadFile(mobileFile, 'categories');
      updateCategoryDto.mobileImageUrl = uploaded.url;
      updateCategoryDto.mobileImageKey = uploaded.key;
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async removeCategory(id: number): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['marcas'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    await this.categoriesRepository.remove(category);
  }

  // Marca methods
  async createMarca(
    createMarcaDto: CreateMarcaDto,
    file?: Express.Multer.File,
    mobileFile?: Express.Multer.File,
  ): Promise<Marca> {
    const category = await this.categoriesRepository.findOne({
      where: { id: createMarcaDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createMarcaDto.categoryId} not found`,
      );
    }

    if (file) {
      const uploaded = await this.s3Service.uploadFile(file, 'marcas');
      createMarcaDto.imageUrl = uploaded.url;
      createMarcaDto.imageKey = uploaded.key;
    }

    if (mobileFile) {
      const uploaded = await this.s3Service.uploadFile(mobileFile, 'marcas');
      createMarcaDto.mobileImageUrl = uploaded.url;
      createMarcaDto.mobileImageKey = uploaded.key;
    }

    const marca = this.marcasRepository.create(createMarcaDto);
    return this.marcasRepository.save(marca);
  }

  async findAllMarcas(): Promise<Marca[]> {
    return this.marcasRepository.find({
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findMarcasByCategory(
    categoryId: number,
    paginationDto?: PaginationDto,
  ): Promise<Marca[] | PaginatedResponseDto<Marca>> {
    if (paginationDto && (paginationDto.page || paginationDto.limit)) {
      const { page = 1, limit = 20 } = paginationDto;
      const skip = (page - 1) * limit;

      const [marcas, total] = await this.marcasRepository.findAndCount({
        where: { categoryId },
        relations: ['category'],
        order: { name: 'ASC' },
        skip,
        take: limit,
      });

      return new PaginatedResponseDto(marcas, total, page, limit);
    }

    return this.marcasRepository.find({
      where: { categoryId },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get products in a category with pagination
   */
  async getProductsByCategory(
    categoryId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    // Verify category exists
    const category = await this.categoriesRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [products, total] = await this.productsRepository.findAndCount({
      where: { categoryId, isActive: true },
      relations: ['category', 'marca', 'images'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = products.map((product) => new ProductResponseDto(product, false));
    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Get products in a marca with pagination
   */
  async getProductsByMarca(
    marcaId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    // Verify marca exists
    const marca = await this.marcasRepository.findOne({ where: { id: marcaId } });
    if (!marca) {
      throw new NotFoundException(`Marca with ID ${marcaId} not found`);
    }

    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [products, total] = await this.productsRepository.findAndCount({
      where: { marcaId, isActive: true },
      relations: ['category', 'marca', 'images'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = products.map((product) => new ProductResponseDto(product, false));
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOneMarca(id: number): Promise<Marca> {
    const marca = await this.marcasRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!marca) {
      throw new NotFoundException(`Marca with ID ${id} not found`);
    }

    return marca;
  }

  async updateMarca(
    id: number,
    updateMarcaDto: UpdateMarcaDto,
    file?: Express.Multer.File,
    mobileFile?: Express.Multer.File,
  ): Promise<Marca> {
    const marca = await this.marcasRepository.findOne({ where: { id } });

    if (!marca) {
      throw new NotFoundException(`Marca with ID ${id} not found`);
    }

    if (updateMarcaDto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateMarcaDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateMarcaDto.categoryId} not found`,
        );
      }
    }

    if (file) {
      if (marca.imageKey) {
        await this.s3Service.deleteFile(marca.imageKey);
      }
      const uploaded = await this.s3Service.uploadFile(file, 'marcas');
      updateMarcaDto.imageUrl = uploaded.url;
      updateMarcaDto.imageKey = uploaded.key;
    }

    if (mobileFile) {
      if (marca.mobileImageKey) {
        await this.s3Service.deleteFile(marca.mobileImageKey);
      }
      const uploaded = await this.s3Service.uploadFile(mobileFile, 'marcas');
      updateMarcaDto.mobileImageUrl = uploaded.url;
      updateMarcaDto.mobileImageKey = uploaded.key;
    }

    Object.assign(marca, updateMarcaDto);
    return this.marcasRepository.save(marca);
  }

  async removeMarca(id: number): Promise<void> {
    const marca = await this.marcasRepository.findOne({ where: { id } });

    if (!marca) {
      throw new NotFoundException(`Marca with ID ${id} not found`);
    }

    await this.marcasRepository.remove(marca);
  }
}
