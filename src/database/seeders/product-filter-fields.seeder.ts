import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Product, Gender, TimeOfDay, Concentration, Projection } from '../../modules/products/entities/product.entity';

export class ProductFilterFieldsSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const productRepository = dataSource.getRepository(Product);
    const products = await productRepository.find();

    if (products.length === 0) {
      console.log('  ⚠ No products found, skipping filter fields seeder');
      return;
    }

    const genders = [Gender.HOMBRE, Gender.MUJER, Gender.UNISEX];
    const times = [TimeOfDay.DIA, TimeOfDay.NOCHE];
    const concentrations = [
      Concentration.EAU_DE_PARFUM,
      Concentration.EAU_DE_TOILETTE,
      Concentration.ELIXIR_DE_PARFUM,
      Concentration.EAU_DE_COLOGNE,
      Concentration.BODY_MIST,
      Concentration.PARFUM_EXTRAIT,
    ];
    const projections = [Projection.DISCRETA, Projection.MODERADA, Projection.ALTA];

    // Assign diverse filter values based on product characteristics
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const name = product.name.toLowerCase();

      // Gender assignment based on category/name patterns
      if (name.includes('women') || name.includes('flora') || name.includes('flower') ||
          name.includes('miss') || name.includes('lady') || name.includes('coco') ||
          name.includes('j\'adore') || name.includes('good girl') || name.includes('la vie') ||
          name.includes('angel') || name.includes('alien') || name.includes('daisy') ||
          name.includes('bloom') || name.includes('romance') || name.includes('olympéa')) {
        product.gender = Gender.MUJER;
      } else if (name.includes('unisex') || name.includes('ck one') || name.includes('molecule') ||
                 name.includes('santal') || name.includes('noir') || name.includes('vetiver')) {
        product.gender = Gender.UNISEX;
      } else {
        // Use category-based assignment or index distribution
        product.gender = genders[i % 3];
      }

      // Time of day — heavier/oriental = night, fresh/citrus = day
      if (name.includes('night') || name.includes('nuit') || name.includes('noir') ||
          name.includes('intense') || name.includes('oud') || name.includes('amber') ||
          name.includes('spice') || name.includes('tobacco') || name.includes('opium') ||
          product.price > 200) {
        product.timeOfDay = TimeOfDay.NOCHE;
      } else if (name.includes('fresh') || name.includes('aqua') || name.includes('light') ||
                 name.includes('sport') || name.includes('cool') || name.includes('blue') ||
                 name.includes('green') || name.includes('citrus')) {
        product.timeOfDay = TimeOfDay.DIA;
      } else {
        product.timeOfDay = times[i % 2];
      }

      // Concentration — distribute based on price range
      if (product.price > 250) {
        product.concentration = Concentration.PARFUM_EXTRAIT;
      } else if (product.price > 180) {
        product.concentration = Concentration.ELIXIR_DE_PARFUM;
      } else if (product.price > 120) {
        product.concentration = Concentration.EAU_DE_PARFUM;
      } else if (product.price > 80) {
        product.concentration = Concentration.EAU_DE_TOILETTE;
      } else if (product.price > 50) {
        product.concentration = Concentration.EAU_DE_COLOGNE;
      } else {
        product.concentration = Concentration.BODY_MIST;
      }

      // Projection — distribute based on concentration
      if (product.concentration === Concentration.PARFUM_EXTRAIT || product.concentration === Concentration.ELIXIR_DE_PARFUM) {
        product.projection = Projection.ALTA;
      } else if (product.concentration === Concentration.EAU_DE_PARFUM) {
        product.projection = projections[i % 3]; // Mix
      } else if (product.concentration === Concentration.EAU_DE_TOILETTE) {
        product.projection = Projection.MODERADA;
      } else {
        product.projection = Projection.DISCRETA;
      }

      // Discount — ~20% of products get a discount
      if (i % 5 === 0) {
        const discounts = [10, 15, 20, 25, 30];
        product.discount = discounts[i % discounts.length];
      }

      // Image URL — unique seed per product using slug of name
      const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      product.imageUrl = `https://picsum.photos/seed/${slug}/400/400`;
    }

    await productRepository.save(products);
    console.log(`✓ Product filter fields updated for ${products.length} products`);

    // Log stats
    const withDiscount = products.filter(p => p.discount && p.discount > 0).length;
    const byGender = {
      hombre: products.filter(p => p.gender === Gender.HOMBRE).length,
      mujer: products.filter(p => p.gender === Gender.MUJER).length,
      unisex: products.filter(p => p.gender === Gender.UNISEX).length,
    };
    console.log(`  - Discounts: ${withDiscount} products`);
    console.log(`  - Gender: H:${byGender.hombre} M:${byGender.mujer} U:${byGender.unisex}`);
  }
}
