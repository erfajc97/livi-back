import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Product } from '../../modules/products/entities/product.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Subcategory } from '../../modules/categories/entities/subcategory.entity';
import { ProductType, MeasureUnit } from '../../modules/products/entities/product.entity';

interface ProductData {
  name: string;
  brand: string;
  price: number;
  description: string;
  stock: number;
  measureValue: number;
  categorySlug: string;
  subcategorySlug: string;
}

export class ProductsSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const productRepository = dataSource.getRepository(Product);
    const categoryRepository = dataSource.getRepository(Category);
    const subcategoryRepository = dataSource.getRepository(Subcategory);

    // Products are already cleared in CategoriesSeeder to respect foreign keys

    // Get all categories and subcategories
    const categories = await categoryRepository.find();
    const subcategories = await subcategoryRepository.find();

    const categoryMap = new Map(categories.map(c => [c.slug, c]));
    const subcategoryMap = new Map(subcategories.map(s => [s.slug, s]));

    // Define hundreds of products
    const productsData: ProductData[] = [
      // Men's Fragrances - Fresh & Citrus
      { name: 'Dior Sauvage', brand: 'Dior', price: 150.0, description: 'Fresh and spicy fragrance with bergamot and pepper', stock: 45, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },
      { name: 'Bleu de Chanel', brand: 'Chanel', price: 165.0, description: 'Fresh aromatic fragrance with citrus and woody notes', stock: 38, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },
      { name: 'Acqua di Gio', brand: 'Giorgio Armani', price: 140.0, description: 'Fresh aquatic fragrance with marine notes', stock: 52, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },
      { name: 'Versace Eros', brand: 'Versace', price: 125.0, description: 'Fresh oriental fragrance with mint and lemon', stock: 41, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },
      { name: 'Polo Blue', brand: 'Ralph Lauren', price: 95.0, description: 'Fresh aquatic fragrance with cucumber and melon', stock: 48, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },
      { name: 'Dolce & Gabbana Light Blue', brand: 'Dolce & Gabbana', price: 110.0, description: 'Fresh Mediterranean fragrance with citrus', stock: 43, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },
      { name: 'Hugo Boss Bottled', brand: 'Hugo Boss', price: 85.0, description: 'Fresh fruity fragrance with apple and plum', stock: 50, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },
      { name: 'Calvin Klein Eternity', brand: 'Calvin Klein', price: 75.0, description: 'Fresh floral fragrance with lavender and sage', stock: 47, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },
      { name: 'Tommy Hilfiger Tommy', brand: 'Tommy Hilfiger', price: 70.0, description: 'Fresh sporty fragrance with apple and mint', stock: 44, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },
      { name: 'Issey Miyake L\'Eau d\'Issey', brand: 'Issey Miyake', price: 105.0, description: 'Fresh aquatic fragrance with yuzu and lotus', stock: 39, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fresh-citrus' },

      // Men's Fragrances - Woody & Spicy
      { name: 'Tom Ford Oud Wood', brand: 'Tom Ford', price: 280.0, description: 'Luxurious woody fragrance with oud and sandalwood', stock: 25, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },
      { name: 'Creed Aventus', brand: 'Creed', price: 350.0, description: 'Sophisticated fruity-woody fragrance with pineapple and birch', stock: 20, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },
      { name: 'Yves Saint Laurent La Nuit de L\'Homme', brand: 'Yves Saint Laurent', price: 145.0, description: 'Spicy woody fragrance with cardamom and cedar', stock: 35, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },
      { name: 'Dior Homme Intense', brand: 'Dior', price: 155.0, description: 'Rich woody fragrance with iris and leather', stock: 32, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },
      { name: 'Burberry London', brand: 'Burberry', price: 100.0, description: 'Warm spicy fragrance with cinnamon and tobacco', stock: 40, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },
      { name: 'Jean Paul Gaultier Le Male', brand: 'Jean Paul Gaultier', price: 115.0, description: 'Spicy oriental fragrance with vanilla and mint', stock: 37, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },
      { name: 'Prada Luna Rossa', brand: 'Prada', price: 130.0, description: 'Fresh spicy fragrance with lavender and ambroxan', stock: 33, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },
      { name: 'Hermès Terre d\'Hermès', brand: 'Hermès', price: 170.0, description: 'Earthy woody fragrance with orange and flint', stock: 28, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },
      { name: 'Givenchy Gentleman', brand: 'Givenchy', price: 120.0, description: 'Modern woody fragrance with iris and patchouli', stock: 36, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },
      { name: 'Montblanc Legend', brand: 'Montblanc', price: 80.0, description: 'Fresh woody fragrance with lavender and oakmoss', stock: 42, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-woody-spicy' },

      // Men's Fragrances - Aquatic & Marine
      { name: 'Davidoff Cool Water', brand: 'Davidoff', price: 65.0, description: 'Fresh aquatic fragrance with mint and lavender', stock: 55, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },
      { name: 'Nautica Voyage', brand: 'Nautica', price: 45.0, description: 'Fresh aquatic fragrance with apple and lotus', stock: 60, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },
      { name: 'Lacoste Essential', brand: 'Lacoste', price: 70.0, description: 'Fresh aquatic fragrance with grapefruit and cedar', stock: 50, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },
      { name: 'Kenneth Cole Reaction', brand: 'Kenneth Cole', price: 55.0, description: 'Fresh aquatic fragrance with citrus and musk', stock: 53, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },
      { name: 'Hollister SoCal', brand: 'Hollister', price: 50.0, description: 'Fresh beachy fragrance with citrus and jasmine', stock: 58, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },
      { name: 'Azzaro Chrome', brand: 'Azzaro', price: 75.0, description: 'Fresh metallic aquatic fragrance with juniper', stock: 48, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },
      { name: 'Perry Ellis 360 Red', brand: 'Perry Ellis', price: 40.0, description: 'Fresh aquatic fragrance with citrus and spices', stock: 62, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },
      { name: 'Clinique Happy', brand: 'Clinique', price: 85.0, description: 'Fresh citrusy fragrance with bergamot and jasmine', stock: 46, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },
      { name: 'Escada Magnetism', brand: 'Escada', price: 90.0, description: 'Fresh spicy aquatic fragrance with cardamom', stock: 44, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },
      { name: 'Polo Sport', brand: 'Ralph Lauren', price: 85.0, description: 'Fresh sporty aquatic fragrance with marine notes', stock: 47, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-aquatic-marine' },

      // Men's Fragrances - Oriental & Amber
      { name: 'Spicebomb', brand: 'Viktor & Rolf', price: 135.0, description: 'Warm spicy fragrance with saffron and tobacco', stock: 30, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },
      { name: '1 Million', brand: 'Paco Rabanne', price: 120.0, description: 'Warm oriental fragrance with blood mandarin and amber', stock: 35, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },
      { name: 'Armani Code', brand: 'Giorgio Armani', price: 110.0, description: 'Warm oriental fragrance with tonka bean and leather', stock: 38, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },
      { name: 'Dolce & Gabbana The One', brand: 'Dolce & Gabbana', price: 125.0, description: 'Warm oriental fragrance with tobacco and amber', stock: 33, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },
      { name: 'Yves Saint Laurent Opium', brand: 'Yves Saint Laurent', price: 140.0, description: 'Rich oriental fragrance with spices and vanilla', stock: 28, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },
      { name: 'Gucci Guilty', brand: 'Gucci', price: 130.0, description: 'Warm oriental fragrance with lavender and patchouli', stock: 32, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },
      { name: 'Thierry Mugler A*Men', brand: 'Thierry Mugler', price: 115.0, description: 'Sweet oriental fragrance with coffee and vanilla', stock: 36, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },
      { name: 'Rochas Man', brand: 'Rochas', price: 95.0, description: 'Warm oriental fragrance with vanilla and amber', stock: 40, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },
      { name: 'Lancôme Hypnôse Homme', brand: 'Lancôme', price: 105.0, description: 'Warm oriental fragrance with vetiver and tonka', stock: 34, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },
      { name: 'Carolina Herrera 212 Men', brand: 'Carolina Herrera', price: 100.0, description: 'Fresh oriental fragrance with lavender and amber', stock: 37, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-oriental-amber' },

      // Men's Fragrances - Fougère & Aromatic
      { name: 'Azzaro Pour Homme', brand: 'Azzaro', price: 70.0, description: 'Classic fougère fragrance with lavender and anise', stock: 45, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },
      { name: 'Drakkar Noir', brand: 'Guy Laroche', price: 60.0, description: 'Classic aromatic fragrance with lavender and juniper', stock: 48, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },
      { name: 'Polo', brand: 'Ralph Lauren', price: 75.0, description: 'Classic aromatic fragrance with basil and patchouli', stock: 43, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },
      { name: 'Kouros', brand: 'Yves Saint Laurent', price: 110.0, description: 'Powerful aromatic fragrance with coriander and patchouli', stock: 30, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },
      { name: 'Aramis', brand: 'Aramis', price: 65.0, description: 'Classic aromatic fragrance with leather and patchouli', stock: 46, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },
      { name: 'Grey Flannel', brand: 'Geoffrey Beene', price: 50.0, description: 'Classic aromatic fragrance with violet and oakmoss', stock: 50, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },
      { name: 'Brut', brand: 'Fabergé', price: 25.0, description: 'Classic aromatic fragrance with lavender and oakmoss', stock: 65, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },
      { name: 'Old Spice', brand: 'Procter & Gamble', price: 20.0, description: 'Classic aromatic fragrance with spices and vanilla', stock: 70, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },
      { name: 'Pinaud Clubman', brand: 'Pinaud', price: 30.0, description: 'Classic aromatic fragrance with lavender and musk', stock: 60, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },
      { name: 'Tabac Original', brand: 'Maurer & Wirtz', price: 40.0, description: 'Classic aromatic fragrance with tobacco and spices', stock: 55, measureValue: 100, categorySlug: 'mens-fragrances', subcategorySlug: 'mens-fougere-aromatic' },

      // Women's Fragrances - Floral
      { name: 'Chanel No. 5', brand: 'Chanel', price: 200.0, description: 'Timeless classic floral fragrance with aldehydes and ylang-ylang', stock: 25, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Miss Dior', brand: 'Dior', price: 145.0, description: 'Elegant floral fragrance with rose and patchouli', stock: 32, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'J\'adore', brand: 'Dior', price: 150.0, description: 'Luxurious floral fragrance with ylang-ylang and jasmine', stock: 30, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Flowerbomb', brand: 'Viktor & Rolf', price: 155.0, description: 'Explosive floral fragrance with jasmine and rose', stock: 28, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'La Vie Est Belle', brand: 'Lancôme', price: 140.0, description: 'Sweet floral fragrance with iris and patchouli', stock: 35, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Coco Mademoiselle', brand: 'Chanel', price: 175.0, description: 'Modern floral fragrance with orange and patchouli', stock: 27, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Daisy', brand: 'Marc Jacobs', price: 120.0, description: 'Fresh floral fragrance with violet and gardenia', stock: 38, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Romance', brand: 'Ralph Lauren', price: 110.0, description: 'Romantic floral fragrance with rose and lily', stock: 40, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Euphoria', brand: 'Calvin Klein', price: 95.0, description: 'Sensual floral fragrance with pomegranate and orchid', stock: 42, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Light Blue', brand: 'Dolce & Gabbana', price: 115.0, description: 'Fresh floral fragrance with Sicilian lemon and jasmine', stock: 36, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Chance', brand: 'Chanel', price: 160.0, description: 'Fresh floral fragrance with jasmine and patchouli', stock: 29, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Acqua di Gioia', brand: 'Giorgio Armani', price: 130.0, description: 'Fresh floral fragrance with jasmine and cedar', stock: 33, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Si', brand: 'Giorgio Armani', price: 135.0, description: 'Modern floral fragrance with blackcurrant and freesia', stock: 31, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Good Girl', brand: 'Carolina Herrera', price: 125.0, description: 'Sensual floral fragrance with tuberose and tonka', stock: 34, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },
      { name: 'Alien', brand: 'Thierry Mugler', price: 140.0, description: 'Mysterious floral fragrance with jasmine and cashmeran', stock: 30, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-floral' },

      // Women's Fragrances - Fruity & Sweet
      { name: 'Black Opium', brand: 'Yves Saint Laurent', price: 145.0, description: 'Sweet oriental fragrance with coffee and vanilla', stock: 32, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Mon Paris', brand: 'Yves Saint Laurent', price: 135.0, description: 'Fruity floral fragrance with strawberry and patchouli', stock: 35, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Angel', brand: 'Thierry Mugler', price: 150.0, description: 'Sweet gourmand fragrance with chocolate and vanilla', stock: 28, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Pink Sugar', brand: 'Aquolina', price: 50.0, description: 'Sweet gourmand fragrance with cotton candy and vanilla', stock: 50, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Fantasy', brand: 'Britney Spears', price: 45.0, description: 'Sweet fruity fragrance with white chocolate and cupcake', stock: 55, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Viva La Juicy', brand: 'Juicy Couture', price: 90.0, description: 'Sweet fruity fragrance with wild berries and vanilla', stock: 40, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Princess', brand: 'Vera Wang', price: 75.0, description: 'Sweet floral fragrance with apple and water lily', stock: 45, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Love Story', brand: 'Chloé', price: 120.0, description: 'Fresh floral fragrance with orange blossom and cedar', stock: 37, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Daisy Dream', brand: 'Marc Jacobs', price: 115.0, description: 'Fresh fruity fragrance with blackberry and jasmine', stock: 38, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Candy', brand: 'Prada', price: 130.0, description: 'Sweet gourmand fragrance with caramel and benzoin', stock: 33, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Dolce', brand: 'Dolce & Gabbana', price: 125.0, description: 'Sweet floral fragrance with neroli and water lily', stock: 34, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Gucci Bloom', brand: 'Gucci', price: 140.0, description: 'Floral fragrance with jasmine and tuberose', stock: 31, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'My Way', brand: 'Giorgio Armani', price: 135.0, description: 'Floral fragrance with orange blossom and tuberose', stock: 32, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Perfect', brand: 'Marc Jacobs', price: 120.0, description: 'Floral fragrance with daffodil and cashmere', stock: 36, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },
      { name: 'Idôle', brand: 'Lancôme', price: 130.0, description: 'Fresh floral fragrance with rose and jasmine', stock: 33, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fruity-sweet' },

      // Women's Fragrances - Oriental & Spicy
      { name: 'Shalimar', brand: 'Guerlain', price: 180.0, description: 'Classic oriental fragrance with vanilla and tonka', stock: 22, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },
      { name: 'Poison', brand: 'Dior', price: 160.0, description: 'Exotic oriental fragrance with tuberose and amber', stock: 25, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },
      { name: 'Obsession', brand: 'Calvin Klein', price: 100.0, description: 'Sensual oriental fragrance with vanilla and spices', stock: 38, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },
      { name: 'Opium', brand: 'Yves Saint Laurent', price: 150.0, description: 'Rich oriental fragrance with spices and amber', stock: 28, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },
      { name: 'Coco', brand: 'Chanel', price: 190.0, description: 'Sophisticated oriental fragrance with patchouli and vanilla', stock: 23, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },
      { name: 'Samsara', brand: 'Guerlain', price: 170.0, description: 'Warm oriental fragrance with sandalwood and jasmine', stock: 26, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },
      { name: 'Hypnotic Poison', brand: 'Dior', price: 155.0, description: 'Sensual oriental fragrance with almond and vanilla', stock: 27, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },
      { name: 'Spellbound', brand: 'Estée Lauder', price: 120.0, description: 'Mysterious oriental fragrance with spices and amber', stock: 35, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },
      { name: 'Youth-Dew', brand: 'Estée Lauder', price: 110.0, description: 'Warm oriental fragrance with spices and patchouli', stock: 37, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },
      { name: 'Tabu', brand: 'Dana', price: 30.0, description: 'Classic oriental fragrance with spices and amber', stock: 60, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-oriental-spicy' },

      // Women's Fragrances - Fresh & Green
      { name: 'Eternity', brand: 'Calvin Klein', price: 85.0, description: 'Fresh floral fragrance with freesia and lily', stock: 45, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },
      { name: 'Pleasures', brand: 'Estée Lauder', price: 95.0, description: 'Fresh floral fragrance with lily and peony', stock: 42, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },
      { name: 'Truth', brand: 'Calvin Klein', price: 80.0, description: 'Fresh green fragrance with bergamot and violet', stock: 47, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },
      { name: 'Allure', brand: 'Chanel', price: 165.0, description: 'Fresh floral fragrance with mandarin and jasmine', stock: 29, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },
      { name: 'Beauty', brand: 'Calvin Klein', price: 90.0, description: 'Fresh floral fragrance with magnolia and peony', stock: 43, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },
      { name: 'CK One', brand: 'Calvin Klein', price: 75.0, description: 'Fresh unisex fragrance with bergamot and green tea', stock: 48, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },
      { name: 'Clinique Happy', brand: 'Clinique', price: 85.0, description: 'Fresh citrusy fragrance with bergamot and jasmine', stock: 46, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },
      { name: 'L\'Eau d\'Issey', brand: 'Issey Miyake', price: 105.0, description: 'Fresh aquatic fragrance with lotus and freesia', stock: 40, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },
      { name: 'Un Jardin Sur Le Toit', brand: 'Hermès', price: 150.0, description: 'Fresh green fragrance with apple and grass', stock: 32, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },
      { name: 'Green Tea', brand: 'Elizabeth Arden', price: 35.0, description: 'Fresh green fragrance with green tea and mint', stock: 58, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-fresh-green' },

      // Women's Fragrances - Chypre & Woody
      { name: 'Coco Mademoiselle', brand: 'Chanel', price: 175.0, description: 'Modern chypre fragrance with orange and patchouli', stock: 27, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },
      { name: 'Miss Dior', brand: 'Dior', price: 145.0, description: 'Elegant chypre fragrance with rose and patchouli', stock: 32, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },
      { name: 'Chance Eau Tendre', brand: 'Chanel', price: 160.0, description: 'Fresh chypre fragrance with jasmine and patchouli', stock: 29, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },
      { name: 'Cristalle', brand: 'Chanel', price: 170.0, description: 'Fresh chypre fragrance with citrus and oakmoss', stock: 26, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },
      { name: 'Paloma Picasso', brand: 'Paloma Picasso', price: 130.0, description: 'Classic chypre fragrance with patchouli and oakmoss', stock: 33, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },
      { name: 'Knowing', brand: 'Estée Lauder', price: 115.0, description: 'Rich chypre fragrance with patchouli and oakmoss', stock: 36, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },
      { name: 'Aromatics Elixir', brand: 'Clinique', price: 100.0, description: 'Classic chypre fragrance with patchouli and rose', stock: 39, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },
      { name: 'Cabochard', brand: 'Grès', price: 90.0, description: 'Classic chypre fragrance with leather and patchouli', stock: 41, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },
      { name: 'Bandit', brand: 'Robert Piguet', price: 140.0, description: 'Classic chypre fragrance with leather and oakmoss', stock: 30, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },
      { name: 'Femme', brand: 'Rochas', price: 110.0, description: 'Classic chypre fragrance with plum and patchouli', stock: 35, measureValue: 100, categorySlug: 'womens-fragrances', subcategorySlug: 'womens-chypre-woody' },

      // Unisex Fragrances - Fresh & Clean
      { name: 'CK One', brand: 'Calvin Klein', price: 75.0, description: 'Fresh unisex fragrance with bergamot and green tea', stock: 48, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },
      { name: 'Acqua di Gio', brand: 'Giorgio Armani', price: 140.0, description: 'Fresh unisex fragrance with marine notes', stock: 35, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },
      { name: 'L\'Eau d\'Issey', brand: 'Issey Miyake', price: 105.0, description: 'Fresh unisex fragrance with yuzu and lotus', stock: 40, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },
      { name: 'Light Blue', brand: 'Dolce & Gabbana', price: 110.0, description: 'Fresh unisex fragrance with Sicilian lemon', stock: 38, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },
      { name: 'Clinique Happy', brand: 'Clinique', price: 85.0, description: 'Fresh unisex fragrance with bergamot and jasmine', stock: 45, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },
      { name: 'Hermès Un Jardin', brand: 'Hermès', price: 150.0, description: 'Fresh unisex fragrance with fig and green leaves', stock: 32, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },
      { name: 'Bulgari Aqua', brand: 'Bulgari', price: 120.0, description: 'Fresh unisex fragrance with marine and mineral notes', stock: 36, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },
      { name: 'Kenzo Pour Homme', brand: 'Kenzo', price: 95.0, description: 'Fresh unisex fragrance with marine and citrus', stock: 42, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },
      { name: 'L\'Eau Par Kenzo', brand: 'Kenzo', price: 100.0, description: 'Fresh unisex fragrance with mint and freesia', stock: 40, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },
      { name: 'Bvlgari Omnia', brand: 'Bulgari', price: 115.0, description: 'Fresh unisex fragrance with green tea and spices', stock: 37, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-fresh-clean' },

      // Unisex Fragrances - Woody & Earthy
      { name: 'Santal 33', brand: 'Le Labo', price: 280.0, description: 'Woody unisex fragrance with sandalwood and violet', stock: 20, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },
      { name: 'Terre d\'Hermès', brand: 'Hermès', price: 170.0, description: 'Earthy unisex fragrance with orange and flint', stock: 28, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },
      { name: 'Tam Dao', brand: 'Diptyque', price: 160.0, description: 'Woody unisex fragrance with sandalwood and cedar', stock: 30, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },
      { name: 'Oud Wood', brand: 'Tom Ford', price: 280.0, description: 'Luxurious woody unisex fragrance with oud and sandalwood', stock: 22, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },
      { name: 'Encre Noire', brand: 'Lalique', price: 80.0, description: 'Woody unisex fragrance with vetiver and cypress', stock: 45, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },
      { name: 'Vetiver', brand: 'Guerlain', price: 120.0, description: 'Woody unisex fragrance with vetiver and tobacco', stock: 38, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },
      { name: 'Hinoki', brand: 'Comme des Garçons', price: 140.0, description: 'Woody unisex fragrance with hinoki and cypress', stock: 33, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },
      { name: 'Cedar', brand: 'Atelier Cologne', price: 150.0, description: 'Woody unisex fragrance with cedar and juniper', stock: 31, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },
      { name: 'Patchouli', brand: 'L\'Artisan Parfumeur', price: 135.0, description: 'Earthy unisex fragrance with patchouli and vanilla', stock: 34, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },
      { name: 'Molecule 01', brand: 'Escentric Molecules', price: 110.0, description: 'Minimalist woody unisex fragrance with iso e super', stock: 39, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-woody-earthy' },

      // Unisex Fragrances - Aromatic & Herbal
      { name: 'Eau de Gentiane Blanche', brand: 'Hermès', price: 160.0, description: 'Herbal unisex fragrance with gentian and white musk', stock: 29, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },
      { name: 'Eau de Rhubarbe Écarlate', brand: 'Hermès', price: 155.0, description: 'Fresh herbal unisex fragrance with rhubarb and rose', stock: 30, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },
      { name: 'Eau de Pamplemousse Rose', brand: 'Hermès', price: 150.0, description: 'Fresh herbal unisex fragrance with grapefruit and rose', stock: 31, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },
      { name: 'Basil & Neroli', brand: 'Jo Malone', price: 130.0, description: 'Herbal unisex fragrance with basil and neroli', stock: 35, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },
      { name: 'Lime Basil & Mandarin', brand: 'Jo Malone', price: 125.0, description: 'Fresh herbal unisex fragrance with lime and basil', stock: 36, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },
      { name: 'Wood Sage & Sea Salt', brand: 'Jo Malone', price: 135.0, description: 'Herbal unisex fragrance with sage and sea salt', stock: 34, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },
      { name: 'Peony & Blush Suede', brand: 'Jo Malone', price: 130.0, description: 'Floral herbal unisex fragrance with peony and suede', stock: 35, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },
      { name: 'Blackberry & Bay', brand: 'Jo Malone', price: 125.0, description: 'Fruity herbal unisex fragrance with blackberry and bay', stock: 36, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },
      { name: 'Pomegranate Noir', brand: 'Jo Malone', price: 130.0, description: 'Fruity herbal unisex fragrance with pomegranate and patchouli', stock: 35, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },
      { name: 'Myrrh & Tonka', brand: 'Jo Malone', price: 140.0, description: 'Warm herbal unisex fragrance with myrrh and tonka', stock: 33, measureValue: 100, categorySlug: 'unisex-fragrances', subcategorySlug: 'unisex-aromatic-herbal' },

      // Niche Fragrances - Artisan & Boutique
      { name: 'Byredo Gypsy Water', brand: 'Byredo', price: 250.0, description: 'Artisan unisex fragrance with pine needles and vanilla', stock: 18, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },
      { name: 'Byredo Bal d\'Afrique', brand: 'Byredo', price: 245.0, description: 'Artisan unisex fragrance with marigold and vetiver', stock: 19, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },
      { name: 'Byredo Black Saffron', brand: 'Byredo', price: 250.0, description: 'Artisan unisex fragrance with saffron and leather', stock: 18, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },
      { name: 'Le Labo Rose 31', brand: 'Le Labo', price: 275.0, description: 'Artisan unisex fragrance with rose and cumin', stock: 16, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },
      { name: 'Le Labo Bergamote 22', brand: 'Le Labo', price: 270.0, description: 'Artisan unisex fragrance with bergamot and vetiver', stock: 17, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },
      { name: 'Le Labo Thé Noir 29', brand: 'Le Labo', price: 275.0, description: 'Artisan unisex fragrance with black tea and fig', stock: 16, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },
      { name: 'Diptyque Philosykos', brand: 'Diptyque', price: 165.0, description: 'Artisan unisex fragrance with fig and coconut', stock: 28, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },
      { name: 'Diptyque Do Son', brand: 'Diptyque', price: 160.0, description: 'Artisan unisex fragrance with tuberose and orange blossom', stock: 29, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },
      { name: 'Diptyque L\'Ombre Dans L\'Eau', brand: 'Diptyque', price: 155.0, description: 'Artisan unisex fragrance with blackcurrant and rose', stock: 30, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },
      { name: 'Maison Margiela Replica', brand: 'Maison Margiela', price: 140.0, description: 'Artisan unisex fragrance collection with various scents', stock: 32, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-artisan-boutique' },

      // Niche Fragrances - Conceptual & Avant-Garde
      { name: 'Comme des Garçons 2', brand: 'Comme des Garçons', price: 145.0, description: 'Avant-garde unisex fragrance with aldehydes and ink', stock: 31, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },
      { name: 'Comme des Garçons Wonderwood', brand: 'Comme des Garçons', price: 150.0, description: 'Avant-garde woody unisex fragrance', stock: 30, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },
      { name: 'Comme des Garçons Black', brand: 'Comme des Garçons', price: 140.0, description: 'Avant-garde unisex fragrance with pepper and incense', stock: 32, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },
      { name: 'L\'Artisan Parfumeur Tea for Two', brand: 'L\'Artisan Parfumeur', price: 135.0, description: 'Conceptual unisex fragrance with tea and spices', stock: 33, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },
      { name: 'Serge Lutens Ambre Sultan', brand: 'Serge Lutens', price: 200.0, description: 'Conceptual oriental unisex fragrance with amber and spices', stock: 24, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },
      { name: 'Serge Lutens Chergui', brand: 'Serge Lutens', price: 195.0, description: 'Conceptual oriental unisex fragrance with honey and tobacco', stock: 25, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },
      { name: 'Serge Lutens Féminité du Bois', brand: 'Serge Lutens', price: 190.0, description: 'Conceptual woody unisex fragrance with cedar and spices', stock: 26, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },
      { name: 'Annick Goutal Eau d\'Hadrien', brand: 'Annick Goutal', price: 120.0, description: 'Conceptual fresh unisex fragrance with citrus and cypress', stock: 36, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },
      { name: 'Annick Goutal Sables', brand: 'Annick Goutal', price: 125.0, description: 'Conceptual warm unisex fragrance with immortelle and hay', stock: 35, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },
      { name: 'Frederic Malle Portrait of a Lady', brand: 'Frederic Malle', price: 300.0, description: 'Conceptual floral unisex fragrance with rose and patchouli', stock: 15, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-conceptual-avant-garde' },

      // Niche Fragrances - Natural & Organic
      { name: 'Aesop Hwyl', brand: 'Aesop', price: 180.0, description: 'Natural woody unisex fragrance with hinoki and vetiver', stock: 27, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },
      { name: 'Aesop Marrakech', brand: 'Aesop', price: 175.0, description: 'Natural spicy unisex fragrance with spices and rose', stock: 28, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },
      { name: 'Aesop Tacit', brand: 'Aesop', price: 170.0, description: 'Natural fresh unisex fragrance with citrus and basil', stock: 29, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },
      { name: 'L\'Occitane Eau des Baux', brand: 'L\'Occitane', price: 95.0, description: 'Natural woody unisex fragrance with cypress and vanilla', stock: 42, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },
      { name: 'L\'Occitane Verveine', brand: 'L\'Occitane', price: 90.0, description: 'Natural fresh unisex fragrance with verbena and citrus', stock: 43, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },
      { name: 'Kiehl\'s Original Musk', brand: 'Kiehl\'s', price: 85.0, description: 'Natural musky unisex fragrance with musk and orange blossom', stock: 44, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },
      { name: 'Weleda Citrus', brand: 'Weleda', price: 40.0, description: 'Natural fresh unisex fragrance with citrus and herbs', stock: 58, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },
      { name: 'Weleda Pomegranate', brand: 'Weleda', price: 45.0, description: 'Natural fruity unisex fragrance with pomegranate', stock: 56, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },
      { name: 'Dr. Hauschka Rose', brand: 'Dr. Hauschka', price: 50.0, description: 'Natural floral unisex fragrance with rose', stock: 54, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },
      { name: 'Burt\'s Bees Natural', brand: 'Burt\'s Bees', price: 35.0, description: 'Natural fresh unisex fragrance with herbs and citrus', stock: 60, measureValue: 100, categorySlug: 'niche-fragrances', subcategorySlug: 'niche-natural-organic' },

      // Designer Fragrances - Luxury Designer
      { name: 'Tom Ford Black Orchid', brand: 'Tom Ford', price: 280.0, description: 'Luxury designer unisex fragrance with black orchid and patchouli', stock: 20, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },
      { name: 'Tom Ford Oud Wood', brand: 'Tom Ford', price: 300.0, description: 'Luxury designer woody unisex fragrance with oud', stock: 18, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },
      { name: 'Tom Ford Tobacco Vanille', brand: 'Tom Ford', price: 295.0, description: 'Luxury designer warm unisex fragrance with tobacco and vanilla', stock: 19, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },
      { name: 'Creed Aventus', brand: 'Creed', price: 350.0, description: 'Luxury designer fruity-woody unisex fragrance', stock: 15, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },
      { name: 'Creed Silver Mountain Water', brand: 'Creed', price: 340.0, description: 'Luxury designer fresh unisex fragrance with tea and citrus', stock: 16, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },
      { name: 'Creed Green Irish Tweed', brand: 'Creed', price: 345.0, description: 'Luxury designer fresh unisex fragrance with violet and sandalwood', stock: 15, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },
      { name: 'Maison Francis Kurkdjian Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian', price: 320.0, description: 'Luxury designer unisex fragrance with saffron and ambergris', stock: 17, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },
      { name: 'Maison Francis Kurkdjian Grand Soir', brand: 'Maison Francis Kurkdjian', price: 315.0, description: 'Luxury designer warm unisex fragrance with vanilla and amber', stock: 18, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },
      { name: 'Penhaligon\'s Halfeti', brand: 'Penhaligon\'s', price: 250.0, description: 'Luxury designer oriental unisex fragrance with rose and oud', stock: 22, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },
      { name: 'Penhaligon\'s Blenheim Bouquet', brand: 'Penhaligon\'s', price: 245.0, description: 'Luxury designer fresh unisex fragrance with lemon and pine', stock: 23, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-luxury' },

      // Designer Fragrances - Celebrity Fragrances
      { name: 'Fancy', brand: 'Jessica Simpson', price: 45.0, description: 'Celebrity sweet unisex fragrance with pear and vanilla', stock: 55, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },
      { name: 'Curious', brand: 'Britney Spears', price: 40.0, description: 'Celebrity fresh unisex fragrance with white lily and vanilla', stock: 58, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },
      { name: 'Midnight Fantasy', brand: 'Britney Spears', price: 42.0, description: 'Celebrity fruity unisex fragrance with plum and jasmine', stock: 57, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },
      { name: 'Glow', brand: 'Jennifer Lopez', price: 50.0, description: 'Celebrity fresh unisex fragrance with orange blossom and musk', stock: 52, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },
      { name: 'Miami Glow', brand: 'Jennifer Lopez', price: 48.0, description: 'Celebrity tropical unisex fragrance with guava and coconut', stock: 53, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },
      { name: 'Reb\'l Fleur', brand: 'Rihanna', price: 55.0, description: 'Celebrity floral unisex fragrance with tuberose and violet', stock: 50, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },
      { name: 'Nude', brand: 'Rihanna', price: 52.0, description: 'Celebrity fresh unisex fragrance with magnolia and musk', stock: 51, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },
      { name: 'Rebel', brand: 'Rihanna', price: 54.0, description: 'Celebrity fruity unisex fragrance with plum and vanilla', stock: 50, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },
      { name: 'Unforgivable', brand: 'Sean John', price: 60.0, description: 'Celebrity fresh unisex fragrance with bergamot and lavender', stock: 48, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },
      { name: 'I Am King', brand: 'Sean John', price: 58.0, description: 'Celebrity woody unisex fragrance with cedar and amber', stock: 49, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-celebrity' },

      // Designer Fragrances - Classic Designer
      { name: 'Chanel No. 5', brand: 'Chanel', price: 200.0, description: 'Classic designer floral unisex fragrance', stock: 25, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
      { name: 'Dior Sauvage', brand: 'Dior', price: 150.0, description: 'Classic designer fresh unisex fragrance', stock: 35, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
      { name: 'Yves Saint Laurent Opium', brand: 'Yves Saint Laurent', price: 150.0, description: 'Classic designer oriental unisex fragrance', stock: 30, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
      { name: 'Giorgio Armani Acqua di Gio', brand: 'Giorgio Armani', price: 140.0, description: 'Classic designer fresh unisex fragrance', stock: 38, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
      { name: 'Calvin Klein CK One', brand: 'Calvin Klein', price: 75.0, description: 'Classic designer fresh unisex fragrance', stock: 48, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
      { name: 'Hugo Boss Hugo', brand: 'Hugo Boss', price: 85.0, description: 'Classic designer fresh unisex fragrance', stock: 45, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
      { name: 'Ralph Lauren Polo', brand: 'Ralph Lauren', price: 75.0, description: 'Classic designer aromatic unisex fragrance', stock: 46, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
      { name: 'Davidoff Cool Water', brand: 'Davidoff', price: 65.0, description: 'Classic designer fresh unisex fragrance', stock: 50, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
      { name: 'Azzaro Pour Homme', brand: 'Azzaro', price: 70.0, description: 'Classic designer aromatic unisex fragrance', stock: 47, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
      { name: 'Drakkar Noir', brand: 'Guy Laroche', price: 60.0, description: 'Classic designer aromatic unisex fragrance', stock: 49, measureValue: 100, categorySlug: 'designer-fragrances', subcategorySlug: 'designer-classic' },
    ];

    // Create products
    const createdProducts = [];
    for (const productData of productsData) {
      const category = categoryMap.get(productData.categorySlug);
      const subcategory = subcategoryMap.get(productData.subcategorySlug);

      if (!category || !subcategory) {
        console.warn(`⚠️  Skipping product ${productData.name}: category or subcategory not found`);
        continue;
      }

      const product = await productRepository.save({
        name: productData.name,
        brand: productData.brand,
        price: productData.price,
      type: ProductType.PERFUME,
        description: productData.description,
        imageUrl: `https://picsum.photos/seed/${productData.name.toLowerCase().replace(/\s+/g, '-')}/400/400`,
        stock: productData.stock,
        measureValue: productData.measureValue,
      measureUnit: MeasureUnit.ML,
        categoryId: category.id,
        subcategoryId: subcategory.id,
      isActive: true,
    });

      createdProducts.push(product);
    }

    console.log('✓ Products seeded');
    console.log(`  - Created ${createdProducts.length} products`);
  }
}
