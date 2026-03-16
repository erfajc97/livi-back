import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOption } from './entities/product-option.entity';
import { ProductOptionValue } from './entities/product-option-value.entity';
import { CreateProductOptionDto } from './dto/create-product-option.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';
import { CreateProductOptionValueDto } from './dto/create-product-option-value.dto';

@Injectable()
export class ProductOptionsService {
  constructor(
    @InjectRepository(ProductOption)
    private optionsRepository: Repository<ProductOption>,
    @InjectRepository(ProductOptionValue)
    private optionValuesRepository: Repository<ProductOptionValue>,
  ) {}

  // ProductOption methods
  async createOption(createOptionDto: CreateProductOptionDto): Promise<ProductOption> {
    const option = this.optionsRepository.create(createOptionDto);
    return this.optionsRepository.save(option);
  }

  async findAllOptions(): Promise<ProductOption[]> {
    return this.optionsRepository.find({
      relations: ['values'],
      order: { name: 'ASC' },
    });
  }

  async findOptionsByType(productType: string): Promise<ProductOption[]> {
    return this.optionsRepository.find({
      where: [{ productType: productType as any }, { productType: null }],
      relations: ['values'],
      order: { name: 'ASC' },
    });
  }

  async findOneOption(id: number): Promise<ProductOption> {
    const option = await this.optionsRepository.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!option) {
      throw new NotFoundException(`Product option with ID ${id} not found`);
    }

    return option;
  }

  async updateOption(id: number, updateOptionDto: UpdateProductOptionDto): Promise<ProductOption> {
    const option = await this.optionsRepository.findOne({ where: { id } });

    if (!option) {
      throw new NotFoundException(`Product option with ID ${id} not found`);
    }

    Object.assign(option, updateOptionDto);
    return this.optionsRepository.save(option);
  }

  async removeOption(id: number): Promise<void> {
    const option = await this.optionsRepository.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!option) {
      throw new NotFoundException(`Product option with ID ${id} not found`);
    }

    await this.optionsRepository.remove(option);
  }

  // ProductOptionValue methods
  async createOptionValue(
    createValueDto: CreateProductOptionValueDto,
  ): Promise<ProductOptionValue> {
    const option = await this.optionsRepository.findOne({
      where: { id: createValueDto.optionId },
    });

    if (!option) {
      throw new NotFoundException(`Product option with ID ${createValueDto.optionId} not found`);
    }

    const value = this.optionValuesRepository.create(createValueDto);
    return this.optionValuesRepository.save(value);
  }

  async findAllOptionValues(): Promise<ProductOptionValue[]> {
    return this.optionValuesRepository.find({
      relations: ['option'],
      order: { value: 'ASC' },
    });
  }

  async findOptionValuesByOption(optionId: number): Promise<ProductOptionValue[]> {
    return this.optionValuesRepository.find({
      where: { optionId },
      relations: ['option'],
      order: { value: 'ASC' },
    });
  }

  async findOneOptionValue(id: number): Promise<ProductOptionValue> {
    const value = await this.optionValuesRepository.findOne({
      where: { id },
      relations: ['option'],
    });

    if (!value) {
      throw new NotFoundException(`Product option value with ID ${id} not found`);
    }

    return value;
  }

  async updateOptionValue(
    id: number,
    updateValueDto: Partial<CreateProductOptionValueDto>,
  ): Promise<ProductOptionValue> {
    const value = await this.optionValuesRepository.findOne({ where: { id } });

    if (!value) {
      throw new NotFoundException(`Product option value with ID ${id} not found`);
    }

    if (updateValueDto.optionId) {
      const option = await this.optionsRepository.findOne({
        where: { id: updateValueDto.optionId },
      });

      if (!option) {
        throw new NotFoundException(
          `Product option with ID ${updateValueDto.optionId} not found`,
        );
      }
    }

    Object.assign(value, updateValueDto);
    return this.optionValuesRepository.save(value);
  }

  async removeOptionValue(id: number): Promise<void> {
    const value = await this.optionValuesRepository.findOne({ where: { id } });

    if (!value) {
      throw new NotFoundException(`Product option value with ID ${id} not found`);
    }

    await this.optionValuesRepository.remove(value);
  }
}
