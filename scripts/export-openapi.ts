import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function exportOpenAPI() {
  // Set environment to skip database connection for OpenAPI export
  process.env.SKIP_DB_CONNECTION = 'true';
  // Set a very short timeout to fail fast
  process.env.DB_CONNECTION_TIMEOUT = '1000';

  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable all logging for cleaner output
  });

  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('E-commerce API with NestJS - Products, Categories, Users, and Authentication')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('categories', 'Category and subcategory management endpoints')
    .addTag('product-options', 'Product options and values management')
    .addTag('product-variations', 'Product variations management')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Export as JSON
  const outputPath = path.join(process.cwd(), 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ OpenAPI specification exported to: ${outputPath}`);
  console.log(`📄 You can now import this file into Apidog`);
  console.log(`📊 Total endpoints: ${Object.keys(document.paths || {}).length}`);

  await app.close();
  process.exit(0);
}

exportOpenAPI().catch((error) => {
  console.error('❌ Error exporting OpenAPI spec:', error);
  process.exit(1);
});
