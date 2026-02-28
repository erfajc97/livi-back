import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { ProductOption } from '../../modules/products/entities/product-option.entity';
import { ProductOptionValue } from '../../modules/products/entities/product-option-value.entity';
import { ProductType } from '../../modules/products/entities/product.entity';

export class ProductOptionsSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const optionRepository = dataSource.getRepository(ProductOption);
    const valueRepository = dataSource.getRepository(ProductOptionValue);

    // Clear existing data (delete in order to respect foreign keys)
    // First delete option values (they reference options)
    const values = await valueRepository.find();
    if (values.length > 0) {
      await valueRepository.remove(values);
    }
    // Then delete options
    const options = await optionRepository.find();
    if (options.length > 0) {
      await optionRepository.remove(options);
    }

    // Create Size Option (for all product types)
    const sizeOption = await optionRepository.save({
      name: 'Size',
      productType: null, // Available for all types
      description: 'Product size variations',
      isActive: true,
    });

    // Create Size Values
    await valueRepository.save([
      { value: 'S', displayName: 'Small', optionId: sizeOption.id, isActive: true },
      { value: 'M', displayName: 'Medium', optionId: sizeOption.id, isActive: true },
      { value: 'L', displayName: 'Large', optionId: sizeOption.id, isActive: true },
      { value: 'XL', displayName: 'Extra Large', optionId: sizeOption.id, isActive: true },
      { value: 'XXL', displayName: 'Double Extra Large', optionId: sizeOption.id, isActive: true },
      { value: 'Oversize', displayName: 'Oversize', optionId: sizeOption.id, isActive: true },
    ]);

    // Create Color Option (for all product types)
    const colorOption = await optionRepository.save({
      name: 'Color',
      productType: null,
      description: 'Product color variations',
      isActive: true,
    });

    // Create Color Values
    await valueRepository.save([
      { value: 'Black', displayName: 'Black', optionId: colorOption.id, isActive: true },
      { value: 'White', displayName: 'White', optionId: colorOption.id, isActive: true },
      { value: 'Blue', displayName: 'Blue', optionId: colorOption.id, isActive: true },
      { value: 'Green', displayName: 'Green', optionId: colorOption.id, isActive: true },
      { value: 'Red', displayName: 'Red', optionId: colorOption.id, isActive: true },
      { value: 'Gray', displayName: 'Gray', optionId: colorOption.id, isActive: true },
      { value: 'Navy', displayName: 'Navy Blue', optionId: colorOption.id, isActive: true },
    ]);

    // Create Volume Option (for perfumes)
    const volumeOption = await optionRepository.save({
      name: 'Volume',
      productType: ProductType.PERFUME,
      description: 'Perfume bottle volume',
      isActive: true,
    });

    // Create Volume Values
    await valueRepository.save([
      { value: '30ml', displayName: '30ml', optionId: volumeOption.id, isActive: true },
      { value: '50ml', displayName: '50ml', optionId: volumeOption.id, isActive: true },
      { value: '100ml', displayName: '100ml', optionId: volumeOption.id, isActive: true },
      { value: '200ml', displayName: '200ml', optionId: volumeOption.id, isActive: true },
    ]);

    // Create Material Option (for clothing)
    const materialOption = await optionRepository.save({
      name: 'Material',
      productType: null,
      description: 'Product material',
      isActive: true,
    });

    // Create Material Values
    await valueRepository.save([
      { value: 'Cotton', displayName: 'Cotton', optionId: materialOption.id, isActive: true },
      { value: 'Polyester', displayName: 'Polyester', optionId: materialOption.id, isActive: true },
      { value: 'Silk', displayName: 'Silk', optionId: materialOption.id, isActive: true },
      { value: 'Linen', displayName: 'Linen', optionId: materialOption.id, isActive: true },
    ]);

    console.log('✓ Product options and values seeded');
  }
}
