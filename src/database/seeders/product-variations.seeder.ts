import { DataSource, IsNull } from 'typeorm';
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

    // Get all products (excluding decants)
    const products = await productRepository.find({
      where: { parentProductId: IsNull() },
    });

    console.log(`Creating variations for ${products.length} products...`);

    let variationCount = 0;
    const variationsToCreate = [];
    const skuSet = new Set<string>();

    // Helper function to generate unique SKU
    const generateUniqueSku = (brand: string, name: string, volume: string): string => {
      const brandCode = brand.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      const nameCode = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      let baseSku = `${brandCode}-${nameCode}-${volume}`;
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
      const baseStock = product.stock;

      // Create 30ml variation (smaller, cheaper)
      if (volume30ml) {
        const price30ml = Math.round(basePrice * 0.4);
        const stock30ml = Math.floor(baseStock * 0.3);
        variationsToCreate.push({
          productId: product.id,
          price: price30ml,
          stock: Math.max(stock30ml, 5), // Minimum 5 in stock
          sku: generateUniqueSku(product.brand, product.name, '30ML'),
          name: '30ml',
          optionValues: [volume30ml],
          isActive: true,
        });
      }

      // Create 50ml variation (medium)
      if (volume50ml) {
        const price50ml = Math.round(basePrice * 0.65);
        const stock50ml = Math.floor(baseStock * 0.4);
        variationsToCreate.push({
          productId: product.id,
          price: price50ml,
          stock: Math.max(stock50ml, 8), // Minimum 8 in stock
          sku: generateUniqueSku(product.brand, product.name, '50ML'),
          name: '50ml',
          optionValues: [volume50ml],
          isActive: true,
        });
      }

      // Create 100ml variation (standard - matches base product)
      if (volume100ml) {
        const price100ml = basePrice;
        const stock100ml = Math.floor(baseStock * 0.5);
        variationsToCreate.push({
          productId: product.id,
          price: price100ml,
          stock: Math.max(stock100ml, 10), // Minimum 10 in stock
          sku: generateUniqueSku(product.brand, product.name, '100ML'),
          name: '100ml',
          optionValues: [volume100ml],
          isActive: true,
        });
      }

      // Create 200ml variation (larger, more expensive) - only for premium products
      if (volume200ml && basePrice >= 150) {
        const price200ml = Math.round(basePrice * 1.6);
        const stock200ml = Math.floor(baseStock * 0.2);
        variationsToCreate.push({
          productId: product.id,
          price: price200ml,
          stock: Math.max(stock200ml, 3), // Minimum 3 in stock
          sku: generateUniqueSku(product.brand, product.name, '200ML'),
          name: '200ml',
          optionValues: [volume200ml],
          isActive: true,
        });
      }
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
