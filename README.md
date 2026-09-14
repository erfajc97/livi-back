# NönDecants API — Backend

API REST con NestJS, TypeORM, PostgreSQL y autenticación JWT. Gestiona el catálogo de perfumes, carrito de compras, órdenes, usuarios y pasarela de pago Payphone.

**Puerto**: `3030`
**Base URL**: `http://localhost:3030/api`
**Documentación Swagger**: http://localhost:3030/api/docs

---

## 🚀 Features

- ✅ **Autenticación JWT** — Login, registro, Google OAuth, refresh tokens
- ✅ **CRUD Completo** — Usuarios, productos, categorías, variantes, opciones
- ✅ **Carrito & Órdenes** — Gestión de carrito, checkout, tracking de envíos
- ✅ **Gestión de Inventario** — Decants, nondecants, variaciones por ML
- ✅ **Roles & Permisos** — Admin/Client, rutas protegidas por rol
- ✅ **Integración Payphone** — Recargo 6%, respuesta de pago, webhook
- ✅ **Métodos de entrega** — Retiro en tienda, Servientrega por ciudad
- ✅ **Google OAuth** — Login con credenciales de Google
- ✅ **Respuesta Estandarizada** — Formato consistente success/error
- ✅ **Validación de inputs** — class-validator + Zod
- ✅ **TypeScript** — Strict mode, tipos completos

---

## 📦 Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | **Node.js 18+** |
| Framework | **NestJS 10** |
| ORM | **TypeORM** |
| Base de datos | **PostgreSQL 16** |
| Autenticación | **JWT** + **Google OAuth** |
| Validación | **class-validator** + **Zod** |
| Documentación | **Swagger/OpenAPI** |
| Testing | **Jest** |
| Lenguaje | **TypeScript** (strict mode) |

---

## 🏗️ Arquitectura & Carpetas

```text
src/
├── common/                      # Utilidades compartidas
│   ├── decorators/              # Custom decorators (@Public, @CurrentUser, @Roles)
│   ├── dto/                     # DTOs compartidos (PaginationDto, ResponseDto)
│   ├── filters/                 # Exception filters (HttpExceptionFilter)
│   ├── guards/                  # Auth guards (JwtGuard, RolesGuard)
│   └── interceptors/            # Response interceptors (TransformInterceptor)
├── config/                      # Configuración (database, JWT, etc.)
├── database/
│   ├── entities/                # TypeORM entities (User, Product, Order, etc.)
│   ├── migrations/              # Database migrations
│   └── seeders/                 # Seeders (usuarios, productos, categorías)
├── modules/                     # Módulos de features (screaming architecture)
│   ├── auth/                    # Login, registro, Google OAuth, refresh
│   ├── users/                   # CRUD usuarios, perfiles, roles
│   ├── products/                # CRUD productos, búsqueda, filtros
│   ├── categories/              # Categorías y subcategorías
│   ├── variations/              # Variantes de productos (Size, Color, ML)
│   ├── options/                 # Opciones de variantes (valores, tipos)
│   ├── cart/                    # Lógica del carrito
│   ├── orders/                  # CRUD órdenes, tracking, estado
│   ├── delivery-methods/        # Métodos de entrega (retiro, Servientrega)
│   ├── payments/                # Integración Payphone
│   ├── banners/                 # Gestión de banners (landing)
│   ├── combos/                  # Productos combo/bundle
│   ├── dashboard/               # Reportes y estadísticas (admin)
│   └── email/                   # Envío de correos (confirmación, tracking)
├── shared/                      # Helpers, types, constantes globales
└── main.ts                      # Entry point
```

---

## 🚀 Quick Start

### Instalación

```bash
# Clonar repo
git clone <repo-url>
cd api-ecommerce-nestjs

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con credenciales PostgreSQL
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres
# POSTGRES_DB=nondecants
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nondecants
```

### Configurar Base de Datos

```bash
# Crear BD (si no existe)
createdb -U postgres nondecants

# Correr migraciones
npm run migration:run

# Ejecutar seeders (usuarios, productos, categorías)
npm run seed
```

### Ejecutar en Desarrollo

```bash
npm run start:dev
```

Acceder a:
- 🌐 API: http://localhost:3030/api
- 📚 Swagger: http://localhost:3030/api/docs

### Build para Producción

```bash
npm run build
npm run start:prod
```

---

## 📡 API Endpoints

### 🔐 Autenticación (Públicos)

| Método | Endpoint | Descripción |
|--------|----------|------------|
| `POST` | `/auth/login` | Login con email/password |
| `POST` | `/auth/register` | Crear cuenta nueva |
| `POST` | `/auth/google` | Login con Google OAuth |
| `POST` | `/auth/refresh` | Renovar JWT token |
| `POST` | `/auth/logout` | Logout (invalidar token) |

**Ejemplo Login:**
```bash
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

### 👥 Usuarios

| Método | Endpoint | Autenticación | Roles |
|--------|----------|---------------|-------|
| `GET` | `/users` | JWT | ADMIN |
| `GET` | `/users/:id` | JWT | ADMIN, OWNER |
| `POST` | `/users` | Públic | - |
| `PATCH` | `/users/:id` | JWT | ADMIN, OWNER |
| `DELETE` | `/users/:id` | JWT | ADMIN |

---

### 📦 Productos

| Método | Endpoint | Descripción |
|--------|----------|------------|
| `GET` | `/products` | Listar productos (público) |
| `GET` | `/products/:id` | Detalle producto |
| `POST` | `/products` | Crear (ADMIN) |
| `PATCH` | `/products/:id` | Editar (ADMIN) |
| `DELETE` | `/products/:id` | Eliminar (ADMIN) |
| `GET` | `/products/:id/variations` | Variantes de un producto |

---

### 🏷️ Categorías

| Método | Endpoint | Descripción |
|--------|----------|------------|
| `GET` | `/categories` | Listar categorías (público) |
| `GET` | `/categories/:id/subcategories` | Subcategorías |
| `POST` | `/categories` | Crear (ADMIN) |
| `PATCH` | `/categories/:id` | Editar (ADMIN) |
| `DELETE` | `/categories/:id` | Eliminar (ADMIN) |

---

### 🛒 Carrito

| Método | Endpoint | Autenticación |
|--------|----------|---------------|
| `GET` | `/cart` | JWT |
| `POST` | `/cart/add` | JWT |
| `PUT` | `/cart/items/:id` | JWT |
| `DELETE` | `/cart/items/:id` | JWT |
| `DELETE` | `/cart` | JWT |

---

### 📋 Órdenes

| Método | Endpoint | Descripción |
|--------|----------|------------|
| `GET` | `/orders` | Listar mis órdenes (JWT) |
| `GET` | `/orders/:id` | Detalle de orden |
| `POST` | `/orders/from-cart` | Crear orden desde carrito |
| `GET` | `/orders/:id/tracking` | Tracking Servientrega |
| `PATCH` | `/orders/:id/status` | Actualizar estado (ADMIN) |

---

### 💳 Pagos

| Método | Endpoint | Descripción |
|--------|----------|------------|
| `POST` | `/payments/create` | Crear pago Payphone |
| `POST` | `/payments/webhook` | Webhook Payphone (callback) |
| `GET` | `/payments/:id` | Estado de pago |

---

## 🔑 Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nondecants
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nondecants

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payphone
PAYPHONE_API_KEY=your-payphone-api-key
PAYPHONE_SECRET=your-payphone-secret
PAYPHONE_MERCHANT_ID=your-merchant-id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# App
NODE_ENV=development
PORT=3030
API_BASE_URL=http://localhost:3030
FRONTEND_URL=http://localhost:4324
```

---

## 🗄️ Gestión de Base de Datos

### Migraciones

```bash
# Generar migración desde cambios de entities
npm run migration:generate -- src/database/migrations/MigrationName

# Crear migración vacía
npm run migration:create -- src/database/migrations/MigrationName

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Mostrar estado de migraciones
npm run migration:show
```

### Seeders

```bash
# Ejecutar todos los seeders
npm run seed

# Seeders incluidos:
# - categories.seeder.ts (5 categorías, 19 subcategorías)
# - product-options.seeder.ts (Size, Color, Volume, Material)
# - products.seeder.ts (200 productos perfumes)
# - decants.seeder.ts (5 decants)
# - product-variations.seeder.ts (662 variaciones totales)
# - users.seeder.ts (12 usuarios: 2 admin, 10 cliente)
```

---

## 🔐 Autenticación & Roles

### Tipos de usuarios

- **ADMIN** — Acceso a CRUD, reportes, gestión de órdenes
- **CLIENT** — Acceso a catálogo, carrito, mis órdenes

### Decoradores & Guards

```typescript
// Rutas públicas
@Public()
@Post('auth/login')
login(@Body() dto: LoginDto) { }

// Rutas autenticadas
@UseGuards(JwtGuard)
@Get('cart')
getCart() { }

// Rutas solo admin
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Post('products')
createProduct() { }
```

---

## 💳 Lógica de Negocio

### Checkout

1. Usuario agrega items al carrito
2. Ingresa datos de entrega (dirección, método)
3. Sistema calcula subtotal + shipping + recargo 6% Payphone
4. Crea orden con estado `PENDING_PAYMENT`
5. Redirige a Payphone para pago
6. Webhook actualiza orden a `PAID` o `FAILED`
7. Sistema prepara envío (retiro o Servientrega)

### Métodos de Entrega

| Método | Ciudad | Costo |
|--------|--------|-------|
| Retiro en tienda | Daule | $0 |
| Servientrega | Guayaquil / Samborondón / Durán | $3 |
| Servientrega | Provincias | $7 |

### Recargo Payphone

- **6% sobre subtotal** — mostrar SIEMPRE en checkout
- Ejemplo: $100 → recargo $6

---

## 📚 Documentación & Tools

### Swagger/OpenAPI

```bash
# API documentation auto-generada
# Acceder a: http://localhost:3030/api/docs
# JSON Schema: http://localhost:3030/api/docs-json
```

### Exportar para Apidog

```bash
npm run export:openapi
# Genera: openapi.json (importar en Apidog)
```

---

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

---

## 📋 Scripts

| Script | Descripción |
|--------|------------|
| `npm run start:dev` | Iniciar en desarrollo (watch mode) |
| `npm run build` | Build para producción |
| `npm run start:prod` | Ejecutar compilado |
| `npm run lint` | Ejecutar ESLint |
| `npm run test` | Ejecutar tests (Jest) |
| `npm run seed` | Ejecutar seeders |
| `npm run migration:run` | Ejecutar migraciones |
| `npm run migration:revert` | Revertir última migración |

---

## 🐳 Docker

Ver `DOCKER.md` para instrucciones completas.

```bash
# Levantar stack completo
docker-compose up --build

# Backend en http://localhost:3030/api
# PostgreSQL en localhost:5432
```

---

## 🚀 Deployment

### Producción

1. Cambiar `JWT_SECRET`, `PAYPHONE_*`, credenciales de BD
2. Configurar SMTP para envío de emails
3. Setup HTTPS/SSL
4. Configurar CORS permitiendo frontend URL
5. Build y deploy:
   ```bash
   npm run build
   npm run start:prod
   ```

---

## 📞 Soporte

Para errores o preguntas:
1. Revisar logs: `npm run start:dev 2>&1 | grep error`
2. Verificar .env está correctamente configurado
3. Validar PostgreSQL está corriendo
4. Revisar migraciones ejecutadas: `npm run migration:show`
# livi-back
