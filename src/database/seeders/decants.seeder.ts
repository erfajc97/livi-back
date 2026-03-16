import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Product } from '../../modules/products/entities/product.entity';
import { MeasureUnit } from '../../modules/products/entities/product.entity';

export class DecantsSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const productRepository = dataSource.getRepository(Product);

    // Get parent products
    const pacoRabanne = await productRepository.findOne({
      where: { name: 'Paco Rabanne' },
    });
    const tomFord = await productRepository.findOne({
      where: { name: 'Tom Ford Black Orchid' },
    });
    const diorSauvage = await productRepository.findOne({
      where: { name: 'Dior Sauvage' },
    });
    const chanelNo5 = await productRepository.findOne({
      where: { name: 'Chanel No. 5' },
    });

    // Create Decants for Paco Rabanne
    if (pacoRabanne) {
      await productRepository.save([
        {
          name: 'Paco Rabanne Decant',
          brand: 'Paco Rabanne',
          price: 40.0,
          type: pacoRabanne.type,
          description: 'Decant from original Paco Rabanne bottle',
          imageUrl: pacoRabanne.imageUrl,
          stock: 20,
          measureValue: 30,
          measureUnit: MeasureUnit.ML,
          categoryId: pacoRabanne.categoryId,
          subcategoryId: pacoRabanne.subcategoryId,
          parentProductId: pacoRabanne.id,
          isActive: true,
        },
        {
          name: 'Paco Rabanne Decant',
          brand: 'Paco Rabanne',
          price: 60.0,
          type: pacoRabanne.type,
          description: 'Decant from original Paco Rabanne bottle',
          imageUrl: pacoRabanne.imageUrl,
          stock: 15,
          measureValue: 50,
          measureUnit: MeasureUnit.ML,
          categoryId: pacoRabanne.categoryId,
          subcategoryId: pacoRabanne.subcategoryId,
          parentProductId: pacoRabanne.id,
          isActive: true,
        },
      ]);
    }

    // Create Decants for Tom Ford
    if (tomFord) {
      await productRepository.save([
        {
          name: 'Tom Ford Black Orchid Decant',
          brand: 'Tom Ford',
          price: 60.0,
          type: tomFord.type,
          description: 'Decant from original Tom Ford Black Orchid bottle',
          imageUrl: tomFord.imageUrl,
          stock: 10,
          measureValue: 30,
          measureUnit: MeasureUnit.ML,
          categoryId: tomFord.categoryId,
          subcategoryId: tomFord.subcategoryId,
          parentProductId: tomFord.id,
          isActive: true,
        },
        {
          name: 'Tom Ford Black Orchid Decant',
          brand: 'Tom Ford',
          price: 90.0,
          type: tomFord.type,
          description: 'Decant from original Tom Ford Black Orchid bottle',
          imageUrl: tomFord.imageUrl,
          stock: 8,
          measureValue: 50,
          measureUnit: MeasureUnit.ML,
          categoryId: tomFord.categoryId,
          subcategoryId: tomFord.subcategoryId,
          parentProductId: tomFord.id,
          isActive: true,
        },
      ]);
    }

    // Create Decants for Dior Sauvage
    if (diorSauvage) {
      await productRepository.save([
        {
          name: 'Dior Sauvage Decant',
          brand: 'Dior',
          price: 50.0,
          type: diorSauvage.type,
          description: 'Decant from original Dior Sauvage bottle',
          imageUrl: diorSauvage.imageUrl,
          stock: 12,
          measureValue: 30,
          measureUnit: MeasureUnit.ML,
          categoryId: diorSauvage.categoryId,
          subcategoryId: diorSauvage.subcategoryId,
          parentProductId: diorSauvage.id,
          isActive: true,
        },
      ]);
    }

    // Create Decants for Chanel No. 5
    if (chanelNo5) {
      await productRepository.save([
        {
          name: 'Chanel No. 5 Decant',
          brand: 'Chanel',
          price: 70.0,
          type: chanelNo5.type,
          description: 'Decant from original Chanel No. 5 bottle',
          imageUrl: chanelNo5.imageUrl,
          stock: 8,
          measureValue: 30,
          measureUnit: MeasureUnit.ML,
          categoryId: chanelNo5.categoryId,
          subcategoryId: chanelNo5.subcategoryId,
          parentProductId: chanelNo5.id,
          isActive: true,
        },
        {
          name: 'Chanel No. 5 Decant',
          brand: 'Chanel',
          price: 100.0,
          type: chanelNo5.type,
          description: 'Decant from original Chanel No. 5 bottle',
          imageUrl: chanelNo5.imageUrl,
          stock: 6,
          measureValue: 50,
          measureUnit: MeasureUnit.ML,
          categoryId: chanelNo5.categoryId,
          subcategoryId: chanelNo5.subcategoryId,
          parentProductId: chanelNo5.id,
          isActive: true,
        },
      ]);
    }

    const decantCount = await productRepository
      .createQueryBuilder('product')
      .where('product.parentProductId IS NOT NULL')
      .getCount();
    console.log('✓ Decants seeded');
    console.log(`  - Created ${decantCount} decants`);
  }
}
