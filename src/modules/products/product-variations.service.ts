import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductVariation } from './entities/product-variation.entity';
import { ProductOptionValue } from './entities/product-option-value.entity';
import { Product } from './entities/product.entity';
import { CreateProductVariationDto } from './dto/create-product-variation.dto';
import { UpdateProductVariationDto } from './dto/update-product-variation.dto';
import { ProductVariationResponseDto } from './dto/product-variation-response.dto';

@Injectable()
export class ProductVariationsService {
  constructor(
    @InjectRepository(ProductVariation)
    private variationsRepository: Repository<ProductVariation>,
    @InjectRepository(ProductOptionValue)
    private optionValuesRepository: Repository<ProductOptionValue>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createVariationDto: CreateProductVariationDto): Promise<ProductVariationResponseDto> {
    // Verify product exists
    const product = await this.productsRepository.findOne({
      where: { id: createVariationDto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${createVariationDto.productId} not found`);
    }

    let optionValues: ProductOptionValue[] = [];

    if (createVariationDto.optionValueIds && createVariationDto.optionValueIds.length > 0) {
      // Verify all option values exist
      optionValues = await this.optionValuesRepository.find({
        where: { id: In(createVariationDto.optionValueIds) },
        relations: ['option'],
      });

      if (optionValues.length !== createVariationDto.optionValueIds.length) {
        throw new NotFoundException('One or more option values not found');
      }

      // Check for duplicate variation (same product + same option values combination)
      const existingVariations = await this.variationsRepository.find({
        where: { productId: createVariationDto.productId },
        relations: ['optionValues'],
      });

      for (const existing of existingVariations) {
        const existingValueIds = existing.optionValues.map((ov) => ov.id).sort();
        const newValueIds = [...createVariationDto.optionValueIds].sort();

        if (JSON.stringify(existingValueIds) === JSON.stringify(newValueIds)) {
          throw new ConflictException(
            'A variation with this exact combination of options already exists',
          );
        }
      }
    }

    const variation = this.variationsRepository.create({
      productId: createVariationDto.productId,
      price: createVariationDto.price,
      cost: createVariationDto.cost,
      sku: createVariationDto.sku,
      name: createVariationDto.name,
      colorHex: createVariationDto.colorHex,
      size: createVariationDto.size,
      isActive: createVariationDto.isActive ?? true,
    });

    if (optionValues.length > 0) {
      variation.optionValues = optionValues;
    }
    const savedVariation = await this.variationsRepository.save(variation);

    return this.findOne(savedVariation.id);
  }

  async findAll(): Promise<ProductVariationResponseDto[]> {
    const variations = await this.variationsRepository.find({
      relations: ['product', 'optionValues', 'optionValues.option'],
    });

    return variations.map((variation) => {
      const p = (variation as any).product;
      return new ProductVariationResponseDto(variation, p?.stock);
    });
  }

  async findByProduct(productId: number): Promise<ProductVariationResponseDto[]> {
    const variations = await this.variationsRepository.find({
      where: { productId },
      relations: ['product', 'optionValues', 'optionValues.option'],
      order: { createdAt: 'ASC' },
    });

    return variations.map((variation) => {
      const p = (variation as any).product;
      return new ProductVariationResponseDto(variation, p?.stock);
    });
  }

  async findOne(id: number): Promise<ProductVariationResponseDto> {
    const variation = await this.variationsRepository.findOne({
      where: { id },
      relations: ['product', 'optionValues', 'optionValues.option'],
    });

    if (!variation) {
      throw new NotFoundException(`Product variation with ID ${id} not found`);
    }

    const p = (variation as any).product;
    return new ProductVariationResponseDto(variation, p?.stock);
  }

  async update(
    id: number,
    updateVariationDto: UpdateProductVariationDto,
  ): Promise<ProductVariationResponseDto> {
    const variation = await this.variationsRepository.findOne({
      where: { id },
      relations: ['optionValues'],
    });

    if (!variation) {
      throw new NotFoundException(`Product variation with ID ${id} not found`);
    }

    // Update option values if provided
    if (updateVariationDto.optionValueIds) {
      const optionValues = await this.optionValuesRepository.find({
        where: { id: In(updateVariationDto.optionValueIds) },
        relations: ['option'],
      });

      if (optionValues.length !== updateVariationDto.optionValueIds.length) {
        throw new NotFoundException('One or more option values not found');
      }

      variation.optionValues = optionValues;
    }

    // Update other fields
    if (updateVariationDto.price !== undefined) {
      variation.price = updateVariationDto.price;
    }
    if (updateVariationDto.cost !== undefined) {
      variation.cost = updateVariationDto.cost;
    }
    if (updateVariationDto.sku !== undefined) {
      variation.sku = updateVariationDto.sku;
    }
    if (updateVariationDto.name !== undefined) {
      variation.name = updateVariationDto.name;
    }
    if (updateVariationDto.colorHex !== undefined) {
      variation.colorHex = updateVariationDto.colorHex;
    }
    if (updateVariationDto.size !== undefined) {
      variation.size = updateVariationDto.size;
    }
    if (updateVariationDto.isActive !== undefined) {
      variation.isActive = updateVariationDto.isActive;
    }

    const updatedVariation = await this.variationsRepository.save(variation);
    return this.findOne(updatedVariation.id);
  }

  async remove(id: number): Promise<void> {
    const variation = await this.variationsRepository.findOne({ where: { id } });

    if (!variation) {
      throw new NotFoundException(`Product variation with ID ${id} not found`);
    }

    await this.variationsRepository.remove(variation);
  }
}
