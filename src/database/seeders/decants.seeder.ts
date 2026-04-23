import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';

/**
 * Decants are no longer separate products.
 * They are now ProductVariations with mlSize and isFullBottle=false.
 * This seeder is kept as a no-op for backward compatibility with the seeder index.
 */
export class DecantsSeeder extends BaseSeeder {
  async seed(_dataSource: DataSource): Promise<void> {
    console.log('✓ Decants seeder skipped (decants are now product variations)');
  }
}
