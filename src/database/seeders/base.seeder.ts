import { DataSource } from 'typeorm';

export abstract class BaseSeeder {
  abstract seed(dataSource: DataSource): Promise<void>;

  async run(dataSource: DataSource): Promise<void> {
    console.log(`Running seeder: ${this.constructor.name}`);
    await this.seed(dataSource);
    console.log(`Completed seeder: ${this.constructor.name}`);
  }
}
