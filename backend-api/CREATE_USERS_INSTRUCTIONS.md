# Crear Usuarios Admin y Trainer

## 📋 Credenciales

```
TRAINER:
Email: trainer@fitness.com
Password: password123
Role: trainer
Name: Panel Trainer

ADMIN:
Email: admin@fitness.com
Password: password123
Role: admin
Name: Panel Admin
```

## 🔧 Opción 1: Ejecutar SQL Directamente

1. Abre tu cliente MySQL (phpMyAdmin, MySQL Workbench, o línea de comandos)
2. Selecciona la base de datos `gym_marketplace`
3. Ejecuta este SQL:

```sql
-- Insert Trainer user
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
    'Panel Trainer',
    'trainer@fitness.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'trainer',
    NOW(),
    NOW()
);

-- Insert Admin user
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
    'Panel Admin',
    'admin@fitness.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    NOW(),
    NOW()
);
```

## 🔧 Opción 2: Usar Laravel Tinker

Abre una terminal en `backend-api` y ejecuta:

```bash
php artisan tinker
```

Luego ejecuta estos comandos:

```php
// Crear Trainer
$trainer = new App\Models\User();
$trainer->name = 'Panel Trainer';
$trainer->email = 'trainer@fitness.com';
$trainer->password = bcrypt('password123');
$trainer->role = 'trainer';
$trainer->save();

// Crear Admin
$admin = new App\Models\User();
$admin->name = 'Panel Admin';
$admin->email = 'admin@fitness.com';
$admin->password = bcrypt('password123');
$admin->role = 'admin';
$admin->save();

// Verificar
App\Models\User::whereIn('email', ['trainer@fitness.com', 'admin@fitness.com'])->get(['id', 'name', 'email', 'role']);
```

## 🔧 Opción 3: Via phpMyAdmin

1. Abre phpMyAdmin (http://localhost/phpmyadmin)
2. Selecciona la base de datos `gym_marketplace`
3. Click en "SQL"
4. Pega el SQL de la Opción 1
5. Click "Ejecutar"

## ✅ Verificar

Puedes verificar que se crearon correctamente:

```sql
SELECT id, name, email, role, created_at 
FROM users 
WHERE email IN ('trainer@fitness.com', 'admin@fitness.com');
```

## 🔐 Nota sobre la Contraseña

El hash `$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` corresponde a la contraseña **"password123"** hasheada con bcrypt (el método que usa Laravel por defecto).

## 📱 Iniciar Sesión en la App

Después de crear los usuarios, puedes iniciar sesión en la app móvil con:

**Trainer:**
- Email: `trainer@fitness.com`
- Password: `password123`

**Admin:**
- Email: `admin@fitness.com`
- Password: `password123`
