import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { Subcategory } from './entities/subcategory.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Product } from '../products/entities/product.entity';
import { ProductResponseDto } from '../products/dto/product-response.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private subcategoriesRepository: Repository<Subcategory>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  // Category methods
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAllCategories(paginationDto?: PaginationDto): Promise<Category[] | PaginatedResponseDto<Category>> {
    if (paginationDto && (paginationDto.page || paginationDto.limit)) {
      const { page = 1, limit = 20 } = paginationDto;
      const skip = (page - 1) * limit;

      const [categories, total] = await this.categoriesRepository.findAndCount({
        relations: ['subcategories'],
        order: { name: 'ASC' },
        skip,
        take: limit,
      });

      return new PaginatedResponseDto(categories, total, page, limit);
    }

    return this.categoriesRepository.find({
      relations: ['subcategories'],
      order: { name: 'ASC' },
    });
  }

  async findOneCategory(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['subcategories'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async removeCategory(id: number): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['subcategories'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    await this.categoriesRepository.remove(category);
  }

  // Subcategory methods
  async createSubcategory(createSubcategoryDto: CreateSubcategoryDto): Promise<Subcategory> {
    const category = await this.categoriesRepository.findOne({
      where: { id: createSubcategoryDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createSubcategoryDto.categoryId} not found`,
      );
    }

    const subcategory = this.subcategoriesRepository.create(createSubcategoryDto);
    return this.subcategoriesRepository.save(subcategory);
  }

  async findAllSubcategories(): Promise<Subcategory[]> {
    return this.subcategoriesRepository.find({
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findSubcategoriesByCategory(
    categoryId: number,
    paginationDto?: PaginationDto,
  ): Promise<Subcategory[] | PaginatedResponseDto<Subcategory>> {
    if (paginationDto && (paginationDto.page || paginationDto.limit)) {
      const { page = 1, limit = 20 } = paginationDto;
      const skip = (page - 1) * limit;

      const [subcategories, total] = await this.subcategoriesRepository.findAndCount({
        where: { categoryId },
        relations: ['category'],
        order: { name: 'ASC' },
        skip,
        take: limit,
      });

      return new PaginatedResponseDto(subcategories, total, page, limit);
    }

    return this.subcategoriesRepository.find({
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
      where: { categoryId, parentProductId: IsNull(), isActive: true },
      relations: ['category', 'subcategory'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = products.map((product) => new ProductResponseDto(product, false));
    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Get products in a subcategory with pagination
   */
  async getProductsBySubcategory(
    subcategoryId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    // Verify subcategory exists
    const subcategory = await this.subcategoriesRepository.findOne({ where: { id: subcategoryId } });
    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${subcategoryId} not found`);
    }

    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [products, total] = await this.productsRepository.findAndCount({
      where: { subcategoryId, parentProductId: IsNull(), isActive: true },
      relations: ['category', 'subcategory'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = products.map((product) => new ProductResponseDto(product, false));
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOneSubcategory(id: number): Promise<Subcategory> {
    const subcategory = await this.subcategoriesRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    return subcategory;
  }

  async updateSubcategory(
    id: number,
    updateSubcategoryDto: UpdateSubcategoryDto,
  ): Promise<Subcategory> {
    const subcategory = await this.subcategoriesRepository.findOne({ where: { id } });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    if (updateSubcategoryDto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateSubcategoryDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateSubcategoryDto.categoryId} not found`,
        );
      }
    }

    Object.assign(subcategory, updateSubcategoryDto);
    return this.subcategoriesRepository.save(subcategory);
  }

  async removeSubcategory(id: number): Promise<void> {
    const subcategory = await this.subcategoriesRepository.findOne({ where: { id } });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    await this.subcategoriesRepository.remove(subcategory);
  }
}
