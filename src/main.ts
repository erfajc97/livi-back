import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  // bodyParser: false → registramos el nuestro con límite amplio. La
  // importación masiva de productos (Excel) envía cientos de filas en un
  // solo JSON y supera el default de 100kb, que Express convertía en un
  // 500 genérico (PayloadTooLargeError).
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI configuration
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
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('categories', 'Category and marca management endpoints')
    .addTag('product-options', 'Product options and values management')
    .addTag('product-variations', 'Product variations management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  const isProd = process.env.NODE_ENV === 'production';

  // Cabeceras de seguridad (sin dependencias externas)
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    if (isProd) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=15552000; includeSubDomains',
      );
    }
    next();
  });

  // CORS: en producción se permiten los dominios propios (nondecants.com y
  // subdominios) más los orígenes de FRONTEND_URL + CORS_ORIGINS (separados
  // por coma); en desarrollo se permite cualquier origen.
  const allowedOrigins = [
    ...(process.env.FRONTEND_URL?.split(',') ?? []),
    ...(process.env.CORS_ORIGINS?.split(',') ?? []),
  ]
    .map((o) => o.trim())
    .filter(Boolean);
  const ownDomainRegex = /^https:\/\/([a-z0-9-]+\.)*nondecants\.com$/i;
  app.enableCors({
    origin: isProd
      ? (origin, callback) => {
          if (
            !origin ||
            ownDomainRegex.test(origin) ||
            allowedOrigins.includes(origin)
          ) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        }
      : true,
    credentials: true,
  });

  const port = process.env.PORT || 4001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`OpenAPI JSON: http://localhost:${port}/api/docs-json`);
}

bootstrap();
