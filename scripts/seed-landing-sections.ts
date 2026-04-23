import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { LandingSection } from '../src/modules/landing-sections/entities/landing-section.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import { Category } from '../src/modules/categories/entities/category.entity';
import { Subcategory } from '../src/modules/categories/entities/subcategory.entity';
import { Brand } from '../src/modules/brands/entities/brand.entity';
import { ProductVariation } from '../src/modules/products/entities/product-variation.entity';
import { ProductImage } from '../src/modules/products/entities/product-image.entity';
import { ProductVideo } from '../src/modules/products/entities/product-video.entity';

config();

async function seedLandingSections() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'nondecants',
    entities: [LandingSection, Product, Category, Subcategory, Brand, ProductVariation, ProductImage, ProductVideo],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connection initialized');

  const landingSectionRepository = dataSource.getRepository(LandingSection);
  const productRepository = dataSource.getRepository(Product);

  try {
    // Check if sections already exist
    const existingSections = await landingSectionRepository.count();
    if (existingSections > 0) {
      console.log('Landing sections already exist. Skipping seed.');
      await dataSource.destroy();
      return;
    }

    // Get some products for initial sections
    const recentProducts = await productRepository.find({
      where: { isActive: true, bajoPedido: false },
      order: { createdAt: 'DESC' },
      take: 8,
    });

    const bestSellingProducts = await productRepository.find({
      where: { isActive: true, bajoPedido: false },
      order: { salesCount: 'DESC' },
      take: 8,
    });

    // Create section 1: ÚLTIMOS INGRESOS
    const section1 = landingSectionRepository.create({
      title: 'ÚLTIMOS INGRESOS',
      order: 1,
      isActive: true,
      products: recentProducts,
    });

    await landingSectionRepository.save(section1);
    console.log('Created section: ÚLTIMOS INGRESOS with', recentProducts.length, 'products');

    // Create section 2: LOS MÁS VENDIDOS
    const section2 = landingSectionRepository.create({
      title: 'LOS MÁS VENDIDOS',
      order: 2,
      isActive: true,
      products: bestSellingProducts,
    });

    await landingSectionRepository.save(section2);
    console.log('Created section: LOS MÁS VENDIDOS with', bestSellingProducts.length, 'products');

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding landing sections:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedLandingSections();
