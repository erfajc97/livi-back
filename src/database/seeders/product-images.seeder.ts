import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Product } from '../../modules/products/entities/product.entity';
import { ProductImage } from '../../modules/products/entities/product-image.entity';
import { ProductVariation } from '../../modules/products/entities/product-variation.entity';
import { ProductVariationImage } from '../../modules/products/entities/product-variation-image.entity';

export class ProductImagesSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const productImageRepo = dataSource.getRepository(ProductImage);
    const variationImageRepo = dataSource.getRepository(ProductVariationImage);
    const productRepo = dataSource.getRepository(Product);
    const variationRepo = dataSource.getRepository(ProductVariation);

    // Clear existing images
    await variationImageRepo.createQueryBuilder().delete().execute();
    await productImageRepo.createQueryBuilder().delete().execute();

    const products = await productRepo.find();
    const variations = await variationRepo.find();

    const slug = (name: string) =>
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create 2-3 product images per product
    const productImages: Partial<ProductImage>[] = [];
    for (const product of products) {
      const s = slug(product.name);
      const count = 2 + (product.id % 2); // 2 or 3 images
      for (let i = 0; i < count; i++) {
        productImages.push({
          productId: product.id,
          url: `https://picsum.photos/seed/${s}-${i}/600/600`,
          key: `products/${product.id}/${s}-${i}.jpg`,
          alt: `${product.name} - imagen ${i + 1}`,
          displayOrder: i,
          isActive: true,
        });
      }
    }

    // Batch insert product images
    const chunk = 200;
    for (let i = 0; i < productImages.length; i += chunk) {
      await productImageRepo.save(productImages.slice(i, i + chunk));
    }

    // Create 1 variation image per variation
    const variationImages: Partial<ProductVariationImage>[] = [];
    for (const variation of variations) {
      const product = products.find((p) => p.id === variation.productId);
      if (!product) continue;
      const s = slug(product.name);
      const ml = variation.mlSize ?? variation.name?.replace(/\D/g, '') ?? '0';
      variationImages.push({
        variationId: variation.id,
        url: `https://picsum.photos/seed/${s}-${ml}ml/600/600`,
        key: `variations/${variation.id}/${s}-${ml}ml.jpg`,
        alt: `${product.name} ${ml}ml`,
        displayOrder: 0,
        isActive: true,
      });
    }

    for (let i = 0; i < variationImages.length; i += chunk) {
      await variationImageRepo.save(variationImages.slice(i, i + chunk));
    }

    console.log(`✓ Product images seeded: ${productImages.length} product images, ${variationImages.length} variation images`);
  }
}
