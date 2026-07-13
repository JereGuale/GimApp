#!/usr/bin/env bash
# Script de build para Render.com
set -o errexit

# Instalar dependencias
composer install --no-dev --optimize-autoloader

# Generar clave si no existe
php artisan key:generate --force

# Crear symlink de storage
php artisan storage:link || true

# Cachear config, rutas y vistas
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Migraciones
php artisan migrate --force

# Optimizar
php artisan optimize

echo "Build completado"
