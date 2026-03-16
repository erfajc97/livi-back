# E-commerce API

A NestJS-based REST API with clean architecture, PostgreSQL, and TypeORM.

## Features

- 🏗️ Clean Architecture (NestJS modular structure)
- 🗄️ PostgreSQL with TypeORM
- 🔐 JWT Authentication with Guards
- ✅ Standardized Request/Response formats
- 📝 Input validation with class-validator
- 🎯 TypeScript with strict mode

## Project Structure

```
src/
├── common/              # Shared utilities
│   ├── decorators/      # Custom decorators
│   ├── dto/             # Common DTOs
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards
│   └── interceptors/    # Response interceptors
├── config/              # Configuration files
├── modules/             # Feature modules
│   ├── auth/           # Authentication module
│   └── users/          # Users module
└── main.ts             # Application entry point
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
```

## Database Setup

1. Make sure PostgreSQL is running
2. Create the database:
   ```bash
   createdb ecommerce
   # Or using psql:
   # psql -U postgres -c "CREATE DATABASE ecommerce;"
   ```
3. Update `.env` with your database credentials
4. Generate migration from your entities:
   ```bash
   npm run migration:generate -- src/database/migrations/InitialMigration
   ```
5. Run migrations:
   ```bash
   npm run migration:run
   ```

### Migration Commands

- `npm run migration:generate -- src/database/migrations/MigrationName` - Generate migration from entity changes
- `npm run migration:create -- src/database/migrations/MigrationName` - Create empty migration file
- `npm run migration:run` - Run all pending migrations
- `npm run migration:revert` - Revert the last migration
- `npm run migration:show` - Show all migrations and their status

## Database Seeding

Seed the database with sample data:

```bash
npm run seed
```

This will create:
- Categories and Subcategories (Perfumes, Clothing)
- Product Options (Size, Color, Volume, Material) with their values
- Sample Products (Perfumes: Paco Rabanne, Tom Ford, Dior Sauvage, Chanel No. 5)
- Decants for perfumes (30ml, 50ml variations)
- Product Variations (for clothing and perfumes)
- Generic products (Blue Collar Shirt with variations)

### Seeder Structure

Seeders are organized in `src/database/seeders/`:
- `categories.seeder.ts` - Categories and subcategories
- `product-options.seeder.ts` - Product options and values
- `products.seeder.ts` - Main products
- `decants.seeder.ts` - Decant products
- `product-variations.seeder.ts` - Product variations

## API Documentation

The API is documented using Swagger/OpenAPI. Once the application is running:

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

### Export OpenAPI Specification for Apidog

To export the OpenAPI specification file for import into Apidog:

```bash
npm run export:openapi
```

This will generate an `openapi.json` file in the root directory that you can import directly into Apidog.

**Import into Apidog:**
1. Open Apidog
2. Go to Import → OpenAPI/Swagger
3. Select the `openapi.json` file
4. All endpoints, schemas, and authentication will be imported automatically

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (Public)

### Users
- `POST /api/users` - Create user (Public)
- `GET /api/users` - Get all users (Protected)
- `GET /api/users/:id` - Get user by ID (Protected)
- `PATCH /api/users/:id` - Update user (Protected)
- `DELETE /api/users/:id` - Delete user (Protected)

## Response Format

All responses follow a standardized format:

### Success Response
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

## Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Use the `@Public()` decorator to make routes public.

## Scripts

- `npm run start:dev` - Start development server
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run migration:generate` - Generate migration
- `npm run migration:run` - Run migrations
- `npm run migration:revert` - Revert last migration
