import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Product } from '../../modules/products/entities/product.entity';
import { ProductVariation } from '../../modules/products/entities/product-variation.entity';
import { ProductOption } from '../../modules/products/entities/product-option.entity';
import { ProductOptionValue } from '../../modules/products/entities/product-option-value.entity';

export class ProductVariationsSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const variationRepository = dataSource.getRepository(ProductVariation);
    const productRepository = dataSource.getRepository(Product);
    const optionRepository = dataSource.getRepository(ProductOption);
    const valueRepository = dataSource.getRepository(ProductOptionValue);

    // Variations are already cleared in CategoriesSeeder to respect foreign keys

    // Get Volume option
    const volumeOption = await optionRepository.findOne({ where: { name: 'Volume' } });
    if (!volumeOption) {
      console.log('⚠️  Volume option not found, skipping variations');
      return;
    }

    // Get volume option values
    const volume30ml = await valueRepository.findOne({
      where: { value: '30ml', optionId: volumeOption.id },
    });
    const volume50ml = await valueRepository.findOne({
      where: { value: '50ml', optionId: volumeOption.id },
    });
    const volume100ml = await valueRepository.findOne({
      where: { value: '100ml', optionId: volumeOption.id },
    });
    const volume200ml = await valueRepository.findOne({
      where: { value: '200ml', optionId: volumeOption.id },
    });

    if (!volume30ml || !volume50ml || !volume100ml || !volume200ml) {
      console.log('⚠️  Volume option values not found, skipping variations');
      return;
    }

    // Get all products
    const products = await productRepository.find();

    console.log(`Creating variations for ${products.length} products...`);

    let variationCount = 0;
    const variationsToCreate = [];
    const skuSet = new Set<string>();

    // Helper function to generate unique SKU
    const generateUniqueSku = (name: string, volume: string): string => {
      const nameCode = name.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '');
      let baseSku = `${nameCode}-${volume}`;
      let sku = baseSku;
      let counter = 1;
      
      while (skuSet.has(sku)) {
        sku = `${baseSku}-${counter}`;
        counter++;
      }
      
      skuSet.add(sku);
      return sku;
    };

    // Create variations for each product
    for (const product of products) {
      const basePrice = Number(product.price);
      const totalMl = Number(product.totalMl);

      // Create 3ml decant variation
      variationsToCreate.push({
        productId: product.id,
        price: Math.round(basePrice * 0.05),
        mlSize: 3,
        isFullBottle: false,
        sku: generateUniqueSku(product.name, '3ML'),
        name: '3ml Decant',
        optionValues: [volume30ml],
        isActive: true,
      });

      // Create 5ml decant variation
      variationsToCreate.push({
        productId: product.id,
        price: Math.round(basePrice * 0.08),
        mlSize: 5,
        isFullBottle: false,
        sku: generateUniqueSku(product.name, '5ML'),
        name: '5ml Decant',
        optionValues: [volume50ml],
        isActive: true,
      });

      // Create 10ml decant variation
      variationsToCreate.push({
        productId: product.id,
        price: Math.round(basePrice * 0.15),
        mlSize: 10,
        isFullBottle: false,
        sku: generateUniqueSku(product.name, '10ML'),
        name: '10ml Decant',
        optionValues: [volume100ml],
        isActive: true,
      });

      // Create full bottle variation (matches product totalMl)
      variationsToCreate.push({
        productId: product.id,
        price: basePrice,
        mlSize: totalMl,
        isFullBottle: true,
        sku: generateUniqueSku(product.name, `${totalMl}ML-FULL`),
        name: `${totalMl}ml Full Bottle`,
        optionValues: [volume200ml],
        isActive: true,
      });
    }

    // Batch insert variations (in chunks to avoid memory issues)
    const chunkSize = 100;
    for (let i = 0; i < variationsToCreate.length; i += chunkSize) {
      const chunk = variationsToCreate.slice(i, i + chunkSize);
      await variationRepository.save(chunk);
      variationCount += chunk.length;
    }

    console.log('✓ Product variations seeded');
    console.log(`  - Created ${variationCount} variations`);
    console.log(`  - Average of ${(variationCount / products.length).toFixed(1)} variations per product`);
  }
}
