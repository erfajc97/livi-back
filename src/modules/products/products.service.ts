import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    // Validate parent product exists if it's a decant
    if (createProductDto.parentProductId) {
      const parentProduct = await this.productsRepository.findOne({
        where: { id: createProductDto.parentProductId },
      });

      if (!parentProduct) {
        throw new NotFoundException(
          `Parent product with ID ${createProductDto.parentProductId} not found`,
        );
      }
    }

    const product = this.productsRepository.create(createProductDto);
    const savedProduct = await this.productsRepository.save(product);

    return this.findOne(savedProduct.id);
  }

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.find({
      relations: ['category', 'subcategory', 'decants', 'images', 'videos'],
      where: { parentProductId: IsNull() }, // Only return main products, not decants
    });

    return products.map((product) => new ProductResponseDto(product));
  }

  async findAllWithDecants(): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.find({
      relations: ['category', 'subcategory', 'decants', 'images', 'videos'],
      where: { parentProductId: IsNull() },
    });

    return products.map((product) => new ProductResponseDto(product));
  }

  async findOne(id: number, includeVariations: boolean = false): Promise<ProductResponseDto> {
    const relations = ['category', 'subcategory', 'parentProduct', 'decants', 'images', 'videos'];
    if (includeVariations) {
      relations.push(
        'variations',
        'variations.optionValues',
        'variations.optionValues.option',
        'variations.images',
        'variations.videos',
      );
    }

    const product = await this.productsRepository.findOne({
      where: { id },
      relations,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return new ProductResponseDto(product, includeVariations);
  }

  /**
   * Find products with pagination and filtering
   */
  async findWithFilters(filterDto: FilterProductsDto): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const {
      page = 1,
      limit = 20,
      type,
      categoryId,
      subcategoryId,
      brand,
      search,
      minPrice,
      maxPrice,
      isActive = true,
      measureUnit,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const queryBuilder = this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.videos', 'videos')
      .where('product.parentProductId IS NULL'); // Only main products, not decants

    // Apply filters
    if (type) {
      queryBuilder.andWhere('product.type = :type', { type });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (subcategoryId) {
      queryBuilder.andWhere('product.subcategoryId = :subcategoryId', { subcategoryId });
    }

    if (brand) {
      queryBuilder.andWhere('product.brand ILIKE :brand', { brand: `%${brand}%` });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.brand ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    if (measureUnit) {
      queryBuilder.andWhere('product.measureUnit = :measureUnit', { measureUnit });
    }

    // Validate and apply sorting
    const allowedSortFields = ['name', 'price', 'brand', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`product.${sortField}`, order);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get results and total count
    const [products, total] = await queryBuilder.getManyAndCount();

    // Map to DTOs
    const data = products.map((product) => new ProductResponseDto(product, false));

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findByCategory(categoryId: number): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.find({
      where: { categoryId, parentProductId: IsNull() },
      relations: ['category', 'subcategory', 'decants', 'images', 'videos'],
    });

    return products.map((product) => new ProductResponseDto(product));
  }

  async findBySubcategory(subcategoryId: number): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.find({
      where: { subcategoryId, parentProductId: IsNull() },
      relations: ['category', 'subcategory', 'decants', 'images', 'videos'],
    });

    return products.map((product) => new ProductResponseDto(product));
  }

  async findByBrand(brand: string): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.find({
      where: { brand, parentProductId: IsNull() },
      relations: ['category', 'subcategory', 'decants', 'images', 'videos'],
    });

    return products.map((product) => new ProductResponseDto(product));
  }

  async findDecants(parentProductId: number): Promise<ProductResponseDto[]> {
    const decants = await this.productsRepository.find({
      where: { parentProductId },
      relations: ['category', 'subcategory', 'images', 'videos'],
    });

    return decants.map((decant) => new ProductResponseDto(decant));
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Validate parent product if being updated
    if (updateProductDto.parentProductId) {
      const parentProduct = await this.productsRepository.findOne({
        where: { id: updateProductDto.parentProductId },
      });

      if (!parentProduct) {
        throw new NotFoundException(
          `Parent product with ID ${updateProductDto.parentProductId} not found`,
        );
      }

      // Prevent circular reference
      if (updateProductDto.parentProductId === id) {
        throw new ConflictException('Product cannot be its own parent');
      }
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productsRepository.save(product);

    return this.findOne(updatedProduct.id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['decants'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if product has decants
    if (product.decants && product.decants.length > 0) {
      throw new ConflictException(
        'Cannot delete product with existing decants. Please delete decants first.',
      );
    }

    await this.productsRepository.remove(product);
  }
}
