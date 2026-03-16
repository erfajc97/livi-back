import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Combo } from '../../modules/combos/entities/combo.entity';
import { ComboProduct } from '../../modules/combos/entities/combo-product.entity';
import { Product } from '../../modules/products/entities/product.entity';

export class CombosSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const comboRepository = dataSource.getRepository(Combo);
    const comboProductRepository = dataSource.getRepository(ComboProduct);
    const productRepository = dataSource.getRepository(Product);

    // Check if combos already exist
    const existingCombos = await comboRepository.find();
    if (existingCombos.length > 0) {
      console.log(`  - Found ${existingCombos.length} existing combos, skipping seeder`);
      return;
    }

    // Get some real products to use in combos
    const products = await productRepository.find({
      where: { parentProductId: undefined },
      take: 12,
      order: { id: 'ASC' },
    });

    if (products.length < 6) {
      console.log('  - Not enough products to create combos, skipping');
      return;
    }

    const combos = [
      {
        name: 'Pack Aventurero',
        description: 'Perfecto para quienes buscan explorar nuevas fragancias. Incluye 3 decants de las marcas más populares.',
        imageUrl: 'https://picsum.photos/seed/combo-aventurero/400/400',
        finalPrice: 75.00,
        sizeLabel: '5ml C/U',
        isActive: true,
        productIds: [products[0].id, products[1].id, products[2].id],
      },
      {
        name: 'Kit Descubrimiento Fraganti',
        description: 'Una selección curada de fragancias para descubrir tu aroma ideal. 4 decants premium a precio especial.',
        imageUrl: 'https://picsum.photos/seed/combo-descubrimiento/400/400',
        finalPrice: 65.00,
        sizeLabel: '5ml C/U',
        isActive: true,
        productIds: [products[3].id, products[4].id, products[5].id, products[6].id],
      },
      {
        name: 'Selección Premium',
        description: 'Las fragancias más exclusivas en un solo pack. Ideal como regalo o para coleccionistas.',
        imageUrl: 'https://picsum.photos/seed/combo-premium/400/400',
        finalPrice: 95.00,
        sizeLabel: '10ml C/U',
        isActive: true,
        productIds: [products[7].id, products[8].id, products[9].id],
      },
    ];

    for (const comboData of combos) {
      const { productIds, ...comboFields } = comboData;

      const combo = await comboRepository.save(comboRepository.create(comboFields));

      const comboProducts = productIds.map((productId) =>
        comboProductRepository.create({
          comboId: combo.id,
          productId,
          quantity: 1,
        }),
      );
      await comboProductRepository.save(comboProducts);
    }

    console.log('✓ Combos seeded');
    console.log(`  - Created ${combos.length} combos`);
    console.log(`  - Total combos: ${await comboRepository.count()}`);
  }
}
