#!/usr/bin/env bash
# Script de build para Render.com
# Se ejecuta automáticamente en cada deploy

set -o errexit  # Detener si hay algún error

# Instalar dependencias de PHP (sin paquetes de desarrollo)
composer install --no-dev --optimize-autoloader

# Generar clave de aplicación si no existe
php artisan key:generate --force

# Limpiar y generar cachés para producción
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones de base de datos
php artisan migrate --force

# Optimizar la aplicación
php artisan optimize

echo "✅ Build completado exitosamente"
