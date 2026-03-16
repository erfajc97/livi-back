import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Category } from '../../modules/categories/entities/category.entity';
import { Subcategory } from '../../modules/categories/entities/subcategory.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { ProductVariation } from '../../modules/products/entities/product-variation.entity';
import { ComboProduct } from '../../modules/combos/entities/combo-product.entity';
import { Combo } from '../../modules/combos/entities/combo.entity';
import { OrderItem } from '../../modules/orders/entities/order-item.entity';
import { Order } from '../../modules/orders/entities/order.entity';

export class CategoriesSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const categoryRepository = dataSource.getRepository(Category);
    const subcategoryRepository = dataSource.getRepository(Subcategory);
    const productRepository = dataSource.getRepository(Product);
    const variationRepository = dataSource.getRepository(ProductVariation);

    // Clear existing data (delete in reverse dependency order)
    // First clear tables that reference products
    const comboProductRepo = dataSource.getRepository(ComboProduct);
    const comboRepo = dataSource.getRepository(Combo);
    const orderItemRepo = dataSource.getRepository(OrderItem);
    const orderRepo = dataSource.getRepository(Order);

    const orderItems = await orderItemRepo.find();
    if (orderItems.length > 0) await orderItemRepo.remove(orderItems);
    const orders = await orderRepo.find();
    if (orders.length > 0) await orderRepo.remove(orders);
    const comboProducts = await comboProductRepo.find();
    if (comboProducts.length > 0) await comboProductRepo.remove(comboProducts);
    const combos = await comboRepo.find();
    if (combos.length > 0) await comboRepo.remove(combos);

    // Delete variations (they reference products)
    const variations = await variationRepository.find();
    if (variations.length > 0) {
      await variationRepository.remove(variations);
    }
    // Then delete products (they reference subcategories)
    const products = await productRepository.find();
    if (products.length > 0) {
      await productRepository.remove(products);
    }
    // Then delete subcategories (they reference categories)
    const subcategories = await subcategoryRepository.find();
    if (subcategories.length > 0) {
      await subcategoryRepository.remove(subcategories);
    }
    // Finally delete categories
    const categories = await categoryRepository.find();
    if (categories.length > 0) {
      await categoryRepository.remove(categories);
    }

    // Create Perfume Categories
    const mensPerfumeCategory = await categoryRepository.save({
      name: "Men's Fragrances",
      slug: 'mens-fragrances',
      description: 'Premium men\'s perfumes and colognes',
      isActive: true,
    });

    const womensPerfumeCategory = await categoryRepository.save({
      name: "Women's Fragrances",
      slug: 'womens-fragrances',
      description: 'Elegant women\'s perfumes and fragrances',
      isActive: true,
    });

    const unisexPerfumeCategory = await categoryRepository.save({
      name: 'Unisex Fragrances',
      slug: 'unisex-fragrances',
      description: 'Versatile fragrances for everyone',
      isActive: true,
    });

    const nichePerfumeCategory = await categoryRepository.save({
      name: 'Niche Fragrances',
      slug: 'niche-fragrances',
      description: 'Exclusive and unique niche perfumes',
      isActive: true,
    });

    const designerPerfumeCategory = await categoryRepository.save({
      name: 'Designer Fragrances',
      slug: 'designer-fragrances',
      description: 'Luxury designer perfumes from top fashion houses',
      isActive: true,
    });

    // Create Subcategories for Men's Fragrances
    const mensSubcategories = await subcategoryRepository.save([
      {
        name: 'Fresh & Citrus',
        slug: 'mens-fresh-citrus',
        description: 'Light, fresh, and invigorating citrus scents',
        categoryId: mensPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Woody & Spicy',
        slug: 'mens-woody-spicy',
        description: 'Rich woody and spicy fragrances',
        categoryId: mensPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Aquatic & Marine',
        slug: 'mens-aquatic-marine',
        description: 'Fresh aquatic and marine-inspired scents',
        categoryId: mensPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Oriental & Amber',
        slug: 'mens-oriental-amber',
        description: 'Warm oriental and amber fragrances',
        categoryId: mensPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Fougère & Aromatic',
        slug: 'mens-fougere-aromatic',
        description: 'Classic fougère and aromatic compositions',
        categoryId: mensPerfumeCategory.id,
        isActive: true,
      },
    ]);

    // Create Subcategories for Women's Fragrances
    const womensSubcategories = await subcategoryRepository.save([
      {
        name: 'Floral',
        slug: 'womens-floral',
        description: 'Delicate and romantic floral scents',
        categoryId: womensPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Fruity & Sweet',
        slug: 'womens-fruity-sweet',
        description: 'Playful fruity and sweet fragrances',
        categoryId: womensPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Oriental & Spicy',
        slug: 'womens-oriental-spicy',
        description: 'Exotic oriental and spicy compositions',
        categoryId: womensPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Fresh & Green',
        slug: 'womens-fresh-green',
        description: 'Crisp fresh and green fragrances',
        categoryId: womensPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Chypre & Woody',
        slug: 'womens-chypre-woody',
        description: 'Sophisticated chypre and woody scents',
        categoryId: womensPerfumeCategory.id,
        isActive: true,
      },
    ]);

    // Create Subcategories for Unisex Fragrances
    const unisexSubcategories = await subcategoryRepository.save([
      {
        name: 'Fresh & Clean',
        slug: 'unisex-fresh-clean',
        description: 'Clean and fresh unisex scents',
        categoryId: unisexPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Woody & Earthy',
        slug: 'unisex-woody-earthy',
        description: 'Natural woody and earthy fragrances',
        categoryId: unisexPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Aromatic & Herbal',
        slug: 'unisex-aromatic-herbal',
        description: 'Herbal and aromatic compositions',
        categoryId: unisexPerfumeCategory.id,
        isActive: true,
      },
    ]);

    // Create Subcategories for Niche Fragrances
    const nicheSubcategories = await subcategoryRepository.save([
      {
        name: 'Artisan & Boutique',
        slug: 'niche-artisan-boutique',
        description: 'Handcrafted artisan and boutique perfumes',
        categoryId: nichePerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Conceptual & Avant-Garde',
        slug: 'niche-conceptual-avant-garde',
        description: 'Unique conceptual and avant-garde scents',
        categoryId: nichePerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Natural & Organic',
        slug: 'niche-natural-organic',
        description: 'Natural and organic niche fragrances',
        categoryId: nichePerfumeCategory.id,
        isActive: true,
      },
    ]);

    // Create Subcategories for Designer Fragrances
    const designerSubcategories = await subcategoryRepository.save([
      {
        name: 'Luxury Designer',
        slug: 'designer-luxury',
        description: 'Premium luxury designer fragrances',
        categoryId: designerPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Celebrity Fragrances',
        slug: 'designer-celebrity',
        description: 'Celebrity-endorsed designer perfumes',
        categoryId: designerPerfumeCategory.id,
        isActive: true,
      },
      {
        name: 'Classic Designer',
        slug: 'designer-classic',
        description: 'Timeless classic designer fragrances',
        categoryId: designerPerfumeCategory.id,
        isActive: true,
      },
    ]);

    console.log('✓ Categories and subcategories seeded');
    console.log(`  - Created ${await categoryRepository.count()} categories`);
    console.log(`  - Created ${await subcategoryRepository.count()} subcategories`);
  }
}
