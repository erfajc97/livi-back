import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductVariation, PresentationType } from './entities/product-variation.entity';
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

    // El tipo de presentación manda: es lo que el admin eligió en el formulario.
    // Antes ganaba `isFullBottle` y el panel siempre lo mandaba en false, así que
    // una variante "sellada" se guardaba como decant y en la ficha salía
    // bloqueada por falta de ml.
    const presentationType =
      createVariationDto.presentationType ??
      (createVariationDto.isFullBottle
        ? PresentationType.SELLADA
        : PresentationType.DECANT);
    const isFullBottle =
      createVariationDto.presentationType != null
        ? presentationType !== PresentationType.DECANT
        : (createVariationDto.isFullBottle ?? false);

    const variation = this.variationsRepository.create({
      productId: createVariationDto.productId,
      price: createVariationDto.price,
      mlSize: createVariationDto.mlSize,
      isFullBottle,
      presentationType,
      sku: createVariationDto.sku,
      name: createVariationDto.name,
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
      return new ProductVariationResponseDto(variation, p?.stock, p?.totalMl, p?.openBottleMlRemaining);
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
      return new ProductVariationResponseDto(variation, p?.stock, p?.totalMl, p?.openBottleMlRemaining);
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
    return new ProductVariationResponseDto(variation, p?.stock, p?.totalMl, p?.openBottleMlRemaining);
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
    if (updateVariationDto.mlSize !== undefined) {
      variation.mlSize = updateVariationDto.mlSize;
    }
    if (updateVariationDto.isFullBottle !== undefined) {
      variation.isFullBottle = updateVariationDto.isFullBottle;
    }
    if (updateVariationDto.presentationType !== undefined) {
      // El tipo elegido en el panel manda sobre `isFullBottle`: el formulario lo
      // manda siempre en false y así una "sellada" terminaba guardada como decant.
      variation.presentationType = updateVariationDto.presentationType;
      variation.isFullBottle =
        updateVariationDto.presentationType !== PresentationType.DECANT;
    }
    if (updateVariationDto.sku !== undefined) {
      variation.sku = updateVariationDto.sku;
    }
    if (updateVariationDto.name !== undefined) {
      variation.name = updateVariationDto.name;
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
