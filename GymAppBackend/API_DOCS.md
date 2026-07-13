# Backend API - Gym App

API REST para la aplicación de gimnasio construida con Laravel 12.

## 🚀 Características

- Autenticación con Laravel Sanctum
- Sistema de roles (admin/user)
- Gestión de categorías y productos
- Planes de suscripción
- Sistema de promociones
- API RESTful completa

## 📋 Requisitos

- PHP 8.2+
- Composer
- MySQL/PostgreSQL/SQLite

## 🛠️ Instalación

```bash
# Clonar repositorio (si aplica)
cd backend-api

# Instalar dependencias
composer install

# Configurar archivo .env
cp .env.example .env
php artisan key:generate

# Ejecutar migraciones con seeders
php artisan migrate:fresh --seed
```

## 🔐 Credenciales de Prueba

### Admin
- Email: `admin@fitness.com`
- Password: `password123`

### Usuario Regular
- Email: `user@fitness.com`
- Password: `password123`

## 📡 Endpoints

### Autenticación

```http
POST /api/register
POST /api/login
```

### Endpoints Públicos (Auth requerido)

```http
GET  /api/home
GET  /api/categories
GET  /api/categories/{id}/products
GET  /api/subscription/plans
GET  /api/subscription/my
```

### Endpoints Admin (Auth + Admin)

#### Categorías
```http
GET    /api/admin/categories
POST   /api/admin/categories
GET    /api/admin/categories/{id}
PUT    /api/admin/categories/{id}
DELETE /api/admin/categories/{id}
```

#### Productos
```http
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/{id}
PUT    /api/admin/products/{id}
DELETE /api/admin/products/{id}
```

#### Planes de Suscripción
```http
GET    /api/admin/subscription-plans
POST   /api/admin/subscription-plans
GET    /api/admin/subscription-plans/{id}
PUT    /api/admin/subscription-plans/{id}
DELETE /api/admin/subscription-plans/{id}
```

#### Promociones
```http
GET    /api/admin/promotions
POST   /api/admin/promotions
GET    /api/admin/promotions/{id}
PUT    /api/admin/promotions/{id}
DELETE /api/admin/promotions/{id}
```

## 🗄️ Modelos

- **User**: Usuarios del sistema (con roles)
- **Category**: Categorías de productos
- **Product**: Productos de la tienda
- **SubscriptionPlan**: Planes de suscripción disponibles
- **Subscription**: Suscripciones activas de usuarios
- **Promotion**: Promociones aplicables a productos/categorías

## 🔒 Autenticación

La API utiliza Laravel Sanctum para autenticación basada en tokens.

### Registro
```bash
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

### Login
```bash
POST /api/login
Content-Type: application/json

{
  "email": "admin@fitness.com",
  "password": "password123"
}
```

### Uso del Token
```bash
Authorization: Bearer {token}
```

## 🎯 Middleware

- `auth:sanctum`: Verifica autenticación
- `admin`: Verifica rol de administrador

## 📝 Notas

- Todos los endpoints requieren autenticación excepto `/register` y `/login`
- Los endpoints bajo `/admin/*` requieren rol de administrador
- Las categorías, productos y planes tienen campo `status` (active/inactive)
- Las promociones pueden aplicarse a productos o categorías específicas
