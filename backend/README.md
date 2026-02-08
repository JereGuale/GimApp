
# Backend Laravel API - Fitness Hub

API REST para la aplicación móvil Fitness Hub desarrollada con Laravel 12.

## 🚀 Servidor en Ejecución

**URL Base:** `http://127.0.0.1:8000/api`

El servidor está corriendo y listo para recibir peticiones.

## 📦 Base de Datos

- **Motor:** PostgreSQL
- **Base de datos:** `gimnasio`
- **Puerto:** 5432

### Tablas Creadas

- `categories` - Categorías de productos
- `products` - Productos del gimnasio
- `subscriptions` - Planes de suscripción
- `users` - Usuarios del sistema

## 🔌 Endpoints Disponibles

### Categorías

```
GET    /api/categories         - Listar todas las categorías
POST   /api/categories         - Crear nueva categoría
GET    /api/categories/{id}    - Obtener categoría específica
PUT    /api/categories/{id}    - Actualizar categoría
DELETE /api/categories/{id}    - Eliminar categoría
```

**Estructura Category:**
```json
{
  "id": 1,
  "name": "Suplementos",
  "icon": "pills",
  "color": "#22D3EE",
  "created_at": "2026-02-05T05:55:00.000000Z",
  "updated_at": "2026-02-05T05:55:00.000000Z",
  "products": []
}
```

### Productos

```
GET    /api/products           - Listar todos los productos
POST   /api/products           - Crear nuevo producto
GET    /api/products/{id}      - Obtener producto específico
PUT    /api/products/{id}      - Actualizar producto
DELETE /api/products/{id}      - Eliminar producto
```

**Filtros disponibles:**
- `?category_id=1` - Filtrar por categoría
- `?is_featured=1` - Solo productos destacados
- `?search=proteina` - Buscar por nombre

**Estructura Product:**
```json
{
  "id": 1,
  "name": "Proteina Whey",
  "description": "Proteína de suero de leche de alta calidad",
  "price": "25.00",
  "image": "https://images.unsplash.com/photo-...",
  "category_id": 1,
  "stock": 75,
  "is_featured": true,
  "created_at": "2026-02-05T05:55:00.000000Z",
  "updated_at": "2026-02-05T05:55:00.000000Z",
  "category": {
    "id": 1,
    "name": "Suplementos",
    "icon": "pills",
    "color": "#22D3EE"
  }
}
```

### Suscripciones

```
GET    /api/subscriptions      - Listar todos los planes
POST   /api/subscriptions      - Crear nuevo plan
GET    /api/subscriptions/{id} - Obtener plan específico
PUT    /api/subscriptions/{id} - Actualizar plan
DELETE /api/subscriptions/{id} - Eliminar plan
```

**Estructura Subscription:**
```json
{
  "id": 2,
  "name": "Plan Pro",
  "description": "El plan más popular con todo incluido",
  "price": "35.00",
  "duration": "monthly",
  "features": [
    "Acceso ilimitado",
    "Clases grupales",
    "Entrenador personal (2 sesiones)",
    "Descuento en productos",
    "Oferta Carnaval incluida"
  ],
  "icon": "fitness",
  "color": "#FB923C",
  "is_best_value": true,
  "created_at": "2026-02-05T05:55:00.000000Z",
  "updated_at": "2026-02-05T05:55:00.000000Z"
}
```

## 📊 Datos de Prueba

La base de datos viene pre-poblada con:

### Categorías (3)
- Suplementos (cyan #22D3EE)
- Ropa Deportiva (orange #FB923C)
- Otros (purple #A78BFA)

### Productos (4)
- Creatina Monohidratada - $30.00
- Proteina Whey - $25.00
- Camiseta Deportiva - $20.00
- Botella Térmica - $15.00

### Suscripciones (3)
- Plan Básico - $20.00/mes
- Plan Pro - $35.00/mes (MEJOR VALOR)
- Plan Elite - $50.00/mes

### Usuario Admin
- Email: `admin@fitness.com`
- Password: `password123`

## 🛠️ Comandos Útiles

```bash
# Iniciar servidor
php artisan serve

# Ejecutar migraciones
php artisan migrate

# Resetear base de datos con datos de prueba
php artisan migrate:fresh --seed

# Ver rutas disponibles
php artisan route:list
```

## 🔧 Configuración en React Native

Para consumir esta API desde tu app React Native, usa:

```javascript
const API_URL = 'http://127.0.0.1:8000/api';

// Obtener productos
const response = await fetch(`${API_URL}/products`);
const products = await response.json();

// Crear producto
const response = await fetch(`${API_URL}/products`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Nuevo Producto',
    price: 15.99,
    category_id: 1
  })
});
```

## 📝 Notas Importantes

1. **CORS:** Ya está configurado para permitir peticiones desde cualquier origen en desarrollo
2. **Validación:** Todos los endpoints tienen validación de datos
3. **Relaciones:** Las categorías incluyen sus productos al consultarlas
4. **JSON Cast:** Los features de subscriptions se guardan y retornan como array automáticamente

## 🚀 Próximos Pasos

Para integrar con el frontend:
1. Reemplazar todos los datos hardcodeados en React Native
2. Crear servicios/API client en la carpeta `src/services/`
3. Implementar estado global (Context API) para cache de datos
4. Agregar autenticación con Laravel Sanctum para el panel admin
