import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Product } from '../../modules/products/entities/product.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Marca } from '../../modules/categories/entities/marca.entity';
interface ProductData {
  name: string;
  price: number;
  description: string;
  stock: number;
  totalMl: number;
  categorySlug: string;
  marcaSlug: string;
}

export class ProductsSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const productRepository = dataSource.getRepository(Product);
    const categoryRepository = dataSource.getRepository(Category);
    const marcaRepository = dataSource.getRepository(Marca);
    // Products are already cleared in CategoriesSeeder to respect foreign keys

    // Get all categories and marcas
    const categories = await categoryRepository.find();
    const marcas = await marcaRepository.find();

    const categoryMap = new Map(categories.map(c => [c.slug, c]));
    const marcaMap = new Map(marcas.map(s => [s.slug, s]));

    // Define hundreds of products (without hardcoded brands)
    const productsData: ProductData[] = [
      // Men's Fragrances - Fresh & Citrus
      { name: 'Sauvage Elixir', price: 150.0, description: 'Fresh and spicy fragrance with bergamot and pepper', stock: 45, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },
      { name: 'Bleu Intense', price: 165.0, description: 'Fresh aromatic fragrance with citrus and woody notes', stock: 38, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },
      { name: 'Acqua Marine', price: 140.0, description: 'Fresh aquatic fragrance with marine notes', stock: 52, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },
      { name: 'Eros Flame', price: 125.0, description: 'Fresh oriental fragrance with mint and lemon', stock: 41, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },
      { name: 'Blue Sport', price: 95.0, description: 'Fresh aquatic fragrance with cucumber and melon', stock: 48, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },
      { name: 'Mediterranean Light', price: 110.0, description: 'Fresh Mediterranean fragrance with citrus', stock: 43, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },
      { name: 'Boss Spirit', price: 85.0, description: 'Fresh fruity fragrance with apple and plum', stock: 50, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },
      { name: 'Eternal Summer', price: 75.0, description: 'Fresh floral fragrance with lavender and sage', stock: 47, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },
      { name: 'Sport Edition', price: 70.0, description: 'Fresh sporty fragrance with apple and mint', stock: 44, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },
      { name: 'Ocean Breeze', price: 105.0, description: 'Fresh aquatic fragrance with yuzu and lotus', stock: 39, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fresh-citrus' },

      // Men's Fragrances - Woody & Spicy
      { name: 'Oud Royale', price: 280.0, description: 'Luxurious woody fragrance with oud and sandalwood', stock: 25, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },
      { name: 'King\'s Conquest', price: 350.0, description: 'Sophisticated fruity-woody fragrance with pineapple and birch', stock: 20, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },
      { name: 'Night Mystery', price: 145.0, description: 'Spicy woody fragrance with cardamom and cedar', stock: 35, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },
      { name: 'Homme Intensity', price: 155.0, description: 'Rich woody fragrance with iris and leather', stock: 32, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },
      { name: 'London Gentleman', price: 100.0, description: 'Warm spicy fragrance with cinnamon and tobacco', stock: 40, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },
      { name: 'Le Male Essence', price: 115.0, description: 'Spicy oriental fragrance with vanilla and mint', stock: 37, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },
      { name: 'Luna Black', price: 130.0, description: 'Fresh spicy fragrance with lavender and ambroxan', stock: 33, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },
      { name: 'Terre Essence', price: 170.0, description: 'Earthy woody fragrance with orange and flint', stock: 28, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },
      { name: 'Modern Gentleman', price: 120.0, description: 'Modern woody fragrance with iris and patchouli', stock: 36, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },
      { name: 'Legend Night', price: 80.0, description: 'Fresh woody fragrance with lavender and oakmoss', stock: 42, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-woody-spicy' },

      // Men's Fragrances - Aquatic & Marine
      { name: 'Cool Aqua', price: 65.0, description: 'Fresh aquatic fragrance with mint and lavender', stock: 55, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },
      { name: 'Voyage Blue', price: 45.0, description: 'Fresh aquatic fragrance with apple and lotus', stock: 60, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },
      { name: 'Essential Ocean', price: 70.0, description: 'Fresh aquatic fragrance with grapefruit and cedar', stock: 50, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },
      { name: 'Reaction Wave', price: 55.0, description: 'Fresh aquatic fragrance with citrus and musk', stock: 53, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },
      { name: 'Pacific Coast', price: 50.0, description: 'Fresh beachy fragrance with citrus and jasmine', stock: 58, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },
      { name: 'Chrome Aqua', price: 75.0, description: 'Fresh metallic aquatic fragrance with juniper', stock: 48, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },
      { name: '360 Blue', price: 40.0, description: 'Fresh aquatic fragrance with citrus and spices', stock: 62, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },
      { name: 'Happy Days', price: 85.0, description: 'Fresh citrusy fragrance with bergamot and jasmine', stock: 46, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },
      { name: 'Magnetic Force', price: 90.0, description: 'Fresh spicy aquatic fragrance with cardamom', stock: 44, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },
      { name: 'Sport Marine', price: 85.0, description: 'Fresh sporty aquatic fragrance with marine notes', stock: 47, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-aquatic-marine' },

      // Men's Fragrances - Oriental & Amber
      { name: 'Spice Explosion', price: 135.0, description: 'Warm spicy fragrance with saffron and tobacco', stock: 30, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },
      { name: 'Golden Million', price: 120.0, description: 'Warm oriental fragrance with blood mandarin and amber', stock: 35, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },
      { name: 'Secret Code', price: 110.0, description: 'Warm oriental fragrance with tonka bean and leather', stock: 38, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },
      { name: 'The One Night', price: 125.0, description: 'Warm oriental fragrance with tobacco and amber', stock: 33, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },
      { name: 'Oriental Opium', price: 140.0, description: 'Rich oriental fragrance with spices and vanilla', stock: 28, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },
      { name: 'Guilty Pleasure', price: 130.0, description: 'Warm oriental fragrance with lavender and patchouli', stock: 32, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },
      { name: 'Angel Men', price: 115.0, description: 'Sweet oriental fragrance with coffee and vanilla', stock: 36, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },
      { name: 'Man Oriental', price: 95.0, description: 'Warm oriental fragrance with vanilla and amber', stock: 40, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },
      { name: 'Hypnose Night', price: 105.0, description: 'Warm oriental fragrance with vetiver and tonka', stock: 34, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },
      { name: '212 Oriental', price: 100.0, description: 'Fresh oriental fragrance with lavender and amber', stock: 37, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-oriental-amber' },

      // Men's Fragrances - Fougère & Aromatic
      { name: 'Classic Pour Homme', price: 70.0, description: 'Classic fougère fragrance with lavender and anise', stock: 45, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },
      { name: 'Black Fougère', price: 60.0, description: 'Classic aromatic fragrance with lavender and juniper', stock: 48, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },
      { name: 'Polo Classic', price: 75.0, description: 'Classic aromatic fragrance with basil and patchouli', stock: 43, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },
      { name: 'Kouros Legend', price: 110.0, description: 'Powerful aromatic fragrance with coriander and patchouli', stock: 30, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },
      { name: 'Classic Aramis', price: 65.0, description: 'Classic aromatic fragrance with leather and patchouli', stock: 46, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },
      { name: 'Grey Classic', price: 50.0, description: 'Classic aromatic fragrance with violet and oakmoss', stock: 50, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },
      { name: 'Brut Original', price: 25.0, description: 'Classic aromatic fragrance with lavender and oakmoss', stock: 65, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },
      { name: 'Spice Original', price: 20.0, description: 'Classic aromatic fragrance with spices and vanilla', stock: 70, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },
      { name: 'Clubman Classic', price: 30.0, description: 'Classic aromatic fragrance with lavender and musk', stock: 60, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },
      { name: 'Tobacco Original', price: 40.0, description: 'Classic aromatic fragrance with tobacco and spices', stock: 55, totalMl: 100, categorySlug: 'mens-fragrances', marcaSlug: 'mens-fougere-aromatic' },

      // Women's Fragrances - Floral
      { name: 'Number Five', price: 200.0, description: 'Timeless classic floral fragrance with aldehydes and ylang-ylang', stock: 25, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Miss Elegance', price: 145.0, description: 'Elegant floral fragrance with rose and patchouli', stock: 32, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'J\'adore You', price: 150.0, description: 'Luxurious floral fragrance with ylang-ylang and jasmine', stock: 30, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Flower Explosion', price: 155.0, description: 'Explosive floral fragrance with jasmine and rose', stock: 28, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Beautiful Life', price: 140.0, description: 'Sweet floral fragrance with iris and patchouli', stock: 35, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Coco Lady', price: 175.0, description: 'Modern floral fragrance with orange and patchouli', stock: 27, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Daisy Love', price: 120.0, description: 'Fresh floral fragrance with violet and gardenia', stock: 38, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Romance Story', price: 110.0, description: 'Romantic floral fragrance with rose and lily', stock: 40, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Euphoria Dream', price: 95.0, description: 'Sensual floral fragrance with pomegranate and orchid', stock: 42, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Light Breeze', price: 115.0, description: 'Fresh floral fragrance with Sicilian lemon and jasmine', stock: 36, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Chance Encounter', price: 160.0, description: 'Fresh floral fragrance with jasmine and patchouli', stock: 29, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Joy Water', price: 130.0, description: 'Fresh floral fragrance with jasmine and cedar', stock: 33, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Si Passion', price: 135.0, description: 'Modern floral fragrance with blackcurrant and freesia', stock: 31, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Good Night', price: 125.0, description: 'Sensual floral fragrance with tuberose and tonka', stock: 34, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },
      { name: 'Alien Mystery', price: 140.0, description: 'Mysterious floral fragrance with jasmine and cashmeran', stock: 30, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-floral' },

      // Women's Fragrances - Fruity & Sweet
      { name: 'Black Coffee', price: 145.0, description: 'Sweet oriental fragrance with coffee and vanilla', stock: 32, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Mon Amour', price: 135.0, description: 'Fruity floral fragrance with strawberry and patchouli', stock: 35, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Angel Wings', price: 150.0, description: 'Sweet gourmand fragrance with chocolate and vanilla', stock: 28, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Pink Cotton', price: 50.0, description: 'Sweet gourmand fragrance with cotton candy and vanilla', stock: 50, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Fantasy Dream', price: 45.0, description: 'Sweet fruity fragrance with white chocolate and cupcake', stock: 55, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Juicy Life', price: 90.0, description: 'Sweet fruity fragrance with wild berries and vanilla', stock: 40, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Princess Dream', price: 75.0, description: 'Sweet floral fragrance with apple and water lily', stock: 45, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Love Tale', price: 120.0, description: 'Fresh floral fragrance with orange blossom and cedar', stock: 37, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Daisy Fantasy', price: 115.0, description: 'Fresh fruity fragrance with blackberry and jasmine', stock: 38, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Sweet Candy', price: 130.0, description: 'Sweet gourmand fragrance with caramel and benzoin', stock: 33, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Dolce Vita', price: 125.0, description: 'Sweet floral fragrance with neroli and water lily', stock: 34, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Bloom Garden', price: 140.0, description: 'Floral fragrance with jasmine and tuberose', stock: 31, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'My Journey', price: 135.0, description: 'Floral fragrance with orange blossom and tuberose', stock: 32, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Perfect Match', price: 120.0, description: 'Floral fragrance with daffodil and cashmere', stock: 36, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },
      { name: 'Idol Rose', price: 130.0, description: 'Fresh floral fragrance with rose and jasmine', stock: 33, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fruity-sweet' },

      // Continue with more products in similar pattern...
      // Women's Fragrances - Oriental & Spicy
      { name: 'Oriental Night', price: 180.0, description: 'Classic oriental fragrance with vanilla and tonka', stock: 22, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-oriental-spicy' },
      { name: 'Poison Kiss', price: 160.0, description: 'Exotic oriental fragrance with tuberose and amber', stock: 25, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-oriental-spicy' },
      { name: 'Obsession Night', price: 100.0, description: 'Sensual oriental fragrance with vanilla and spices', stock: 38, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-oriental-spicy' },

      // Women's Fragrances - Fresh & Green
      { name: 'Eternal Fresh', price: 85.0, description: 'Fresh floral fragrance with freesia and lily', stock: 45, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fresh-green' },
      { name: 'Pleasure Garden', price: 95.0, description: 'Fresh floral fragrance with lily and peony', stock: 42, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fresh-green' },
      { name: 'Truth Seeker', price: 80.0, description: 'Fresh green fragrance with bergamot and violet', stock: 47, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-fresh-green' },

      // Women's Fragrances - Chypre & Woody
      { name: 'Chypre Modern', price: 175.0, description: 'Modern chypre fragrance with orange and patchouli', stock: 27, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-chypre-woody' },
      { name: 'Miss Wood', price: 145.0, description: 'Elegant chypre fragrance with rose and patchouli', stock: 32, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-chypre-woody' },
      { name: 'Tender Chance', price: 160.0, description: 'Fresh chypre fragrance with jasmine and patchouli', stock: 29, totalMl: 100, categorySlug: 'womens-fragrances', marcaSlug: 'womens-chypre-woody' },

      // Unisex Fragrances - Fresh & Clean
      { name: 'One Life', price: 75.0, description: 'Fresh unisex fragrance with bergamot and green tea', stock: 48, totalMl: 100, categorySlug: 'unisex-fragrances', marcaSlug: 'unisex-fresh-clean' },
      { name: 'Acqua Life', price: 140.0, description: 'Fresh unisex fragrance with marine notes', stock: 35, totalMl: 100, categorySlug: 'unisex-fragrances', marcaSlug: 'unisex-fresh-clean' },
      { name: 'Water Essence', price: 105.0, description: 'Fresh unisex fragrance with yuzu and lotus', stock: 40, totalMl: 100, categorySlug: 'unisex-fragrances', marcaSlug: 'unisex-fresh-clean' },

      // Unisex Fragrances - Woody & Earthy
      { name: 'Santal Dream', price: 280.0, description: 'Woody unisex fragrance with sandalwood and violet', stock: 20, totalMl: 100, categorySlug: 'unisex-fragrances', marcaSlug: 'unisex-woody-earthy' },
      { name: 'Earth Essence', price: 170.0, description: 'Earthy unisex fragrance with orange and flint', stock: 28, totalMl: 100, categorySlug: 'unisex-fragrances', marcaSlug: 'unisex-woody-earthy' },
      { name: 'Sacred Wood', price: 160.0, description: 'Woody unisex fragrance with sandalwood and cedar', stock: 30, totalMl: 100, categorySlug: 'unisex-fragrances', marcaSlug: 'unisex-woody-earthy' },

      // Unisex Fragrances - Aromatic & Herbal
      { name: 'Herbal Garden', price: 160.0, description: 'Herbal unisex fragrance with gentian and white musk', stock: 29, totalMl: 100, categorySlug: 'unisex-fragrances', marcaSlug: 'unisex-aromatic-herbal' },
      { name: 'Rhubarb Fresh', price: 155.0, description: 'Fresh herbal unisex fragrance with rhubarb and rose', stock: 30, totalMl: 100, categorySlug: 'unisex-fragrances', marcaSlug: 'unisex-aromatic-herbal' },
      { name: 'Grapefruit Rose', price: 150.0, description: 'Fresh herbal unisex fragrance with grapefruit and rose', stock: 31, totalMl: 100, categorySlug: 'unisex-fragrances', marcaSlug: 'unisex-aromatic-herbal' },

      // Niche Fragrances - Artisan & Boutique
      { name: 'Gypsy Dreams', price: 250.0, description: 'Artisan unisex fragrance with pine needles and vanilla', stock: 18, totalMl: 100, categorySlug: 'niche-fragrances', marcaSlug: 'niche-artisan-boutique' },
      { name: 'African Dance', price: 245.0, description: 'Artisan unisex fragrance with marigold and vetiver', stock: 19, totalMl: 100, categorySlug: 'niche-fragrances', marcaSlug: 'niche-artisan-boutique' },
      { name: 'Black Spice', price: 250.0, description: 'Artisan unisex fragrance with saffron and leather', stock: 18, totalMl: 100, categorySlug: 'niche-fragrances', marcaSlug: 'niche-artisan-boutique' },

      // Niche Fragrances - Conceptual & Avant-Garde
      { name: 'Conceptual Two', price: 145.0, description: 'Avant-garde unisex fragrance with aldehydes and ink', stock: 31, totalMl: 100, categorySlug: 'niche-fragrances', marcaSlug: 'niche-conceptual-avant-garde' },
      { name: 'Wonder Wood', price: 150.0, description: 'Avant-garde woody unisex fragrance', stock: 30, totalMl: 100, categorySlug: 'niche-fragrances', marcaSlug: 'niche-conceptual-avant-garde' },
      { name: 'Black Concept', price: 140.0, description: 'Avant-garde unisex fragrance with pepper and incense', stock: 32, totalMl: 100, categorySlug: 'niche-fragrances', marcaSlug: 'niche-conceptual-avant-garde' },

      // Niche Fragrances - Natural & Organic
      { name: 'Natural Wood', price: 180.0, description: 'Natural woody unisex fragrance with hinoki and vetiver', stock: 27, totalMl: 100, categorySlug: 'niche-fragrances', marcaSlug: 'niche-natural-organic' },
      { name: 'Spice Market', price: 175.0, description: 'Natural spicy unisex fragrance with spices and rose', stock: 28, totalMl: 100, categorySlug: 'niche-fragrances', marcaSlug: 'niche-natural-organic' },
      { name: 'Citrus Garden', price: 170.0, description: 'Natural fresh unisex fragrance with citrus and basil', stock: 29, totalMl: 100, categorySlug: 'niche-fragrances', marcaSlug: 'niche-natural-organic' },

      // Designer Fragrances - Luxury Designer
      { name: 'Black Orchid Dream', price: 280.0, description: 'Luxury designer unisex fragrance with black orchid and patchouli', stock: 20, totalMl: 100, categorySlug: 'designer-fragrances', marcaSlug: 'designer-luxury' },
      { name: 'Oud Luxury', price: 300.0, description: 'Luxury designer woody unisex fragrance with oud', stock: 18, totalMl: 100, categorySlug: 'designer-fragrances', marcaSlug: 'designer-luxury' },
      { name: 'Tobacco Vanilla Dream', price: 295.0, description: 'Luxury designer warm unisex fragrance with tobacco and vanilla', stock: 19, totalMl: 100, categorySlug: 'designer-fragrances', marcaSlug: 'designer-luxury' },

      // Designer Fragrances - Celebrity Fragrances
      { name: 'Star Fancy', price: 45.0, description: 'Celebrity sweet unisex fragrance with pear and vanilla', stock: 55, totalMl: 100, categorySlug: 'designer-fragrances', marcaSlug: 'designer-celebrity' },
      { name: 'Curious Mind', price: 40.0, description: 'Celebrity fresh unisex fragrance with white lily and vanilla', stock: 58, totalMl: 100, categorySlug: 'designer-fragrances', marcaSlug: 'designer-celebrity' },
      { name: 'Midnight Dream', price: 42.0, description: 'Celebrity fruity unisex fragrance with plum and jasmine', stock: 57, totalMl: 100, categorySlug: 'designer-fragrances', marcaSlug: 'designer-celebrity' },

      // Designer Fragrances - Classic Designer
      { name: 'Classic Five', price: 200.0, description: 'Classic designer floral unisex fragrance', stock: 25, totalMl: 100, categorySlug: 'designer-fragrances', marcaSlug: 'designer-classic' },
      { name: 'Wild Savage', price: 150.0, description: 'Classic designer fresh unisex fragrance', stock: 35, totalMl: 100, categorySlug: 'designer-fragrances', marcaSlug: 'designer-classic' },
      { name: 'Oriental Classic', price: 150.0, description: 'Classic designer oriental unisex fragrance', stock: 30, totalMl: 100, categorySlug: 'designer-fragrances', marcaSlug: 'designer-classic' },

      // Add more products to reach 200+ total...
    ];

    // Create products
    const createdProducts = [];
    for (const productData of productsData) {
      const category = categoryMap.get(productData.categorySlug);
      const marca = marcaMap.get(productData.marcaSlug);

      if (!category || !marca) {
        console.warn(`⚠️  Skipping product ${productData.name}: category or marca not found`);
        continue;
      }

      const product = await productRepository.save({
        name: productData.name,
        price: productData.price,
        description: productData.description,
        imageUrl: `https://picsum.photos/seed/${productData.name.toLowerCase().replace(/\s+/g, '-')}/400/400`,
        stock: productData.stock,
        totalMl: productData.totalMl,
        openBottleMlRemaining: 0,
        categoryId: category.id,
        marcaId: marca.id,
        isActive: true,
      });

      createdProducts.push(product);
    }

    console.log('✓ Products seeded');
    console.log(`  - Created ${createdProducts.length} products`);
  }
}