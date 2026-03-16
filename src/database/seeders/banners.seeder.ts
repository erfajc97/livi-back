import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { Banner } from '../../modules/banners/entities/banner.entity';

export class BannersSeeder extends BaseSeeder {
  async seed(dataSource: DataSource): Promise<void> {
    const bannerRepository = dataSource.getRepository(Banner);

    const existingBanners = await bannerRepository.find();
    if (existingBanners.length > 0) {
      console.log(`  - Found ${existingBanners.length} existing banners, skipping seeder`);
      return;
    }

    const banners = [
      {
        title: 'Nuevos Perfumes Importados',
        subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
        imageUrl: 'https://picsum.photos/seed/banner1/800/400',
        link: '/catalogo',
        isVisible: true,
        position: 1,
      },
      {
        title: 'Oferta de Temporada',
        subtitle: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.',
        imageUrl: 'https://picsum.photos/seed/banner2/800/400',
        link: '/catalogo?discount=true',
        isVisible: true,
        position: 2,
      },
      {
        title: 'Decants Premium',
        subtitle: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.',
        imageUrl: 'https://picsum.photos/seed/banner3/800/400',
        link: '/catalogo?type=decant',
        isVisible: true,
        position: 3,
      },
      {
        title: 'Combos Exclusivos',
        subtitle: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.',
        imageUrl: 'https://picsum.photos/seed/banner4/800/400',
        link: '/catalogo?type=combo',
        isVisible: true,
        position: 4,
      },
      {
        title: 'Envío Gratis Guayaquil',
        subtitle: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur.',
        imageUrl: 'https://picsum.photos/seed/banner5/800/400',
        link: '/catalogo',
        isVisible: false,
        position: 5,
      },
    ];

    await bannerRepository.save(banners);

    console.log('✓ Banners seeded');
    console.log(`  - Created ${banners.length} banners (${banners.filter((b) => b.isVisible).length} visible)`);
    console.log(`  - Total banners: ${await bannerRepository.count()}`);
  }
}
