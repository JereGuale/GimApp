-- ==============================================================================
-- SQL KEEP-ALIVE DIRECTO EN SUPABASE (Opcional - Ejecutar en SQL Editor de Supabase)
-- ==============================================================================
-- Este script activa las extensiones nativas de Postgres en Supabase para que 
-- la base de datos se mantenga activa y despierte automáticamente al backend.
-- ==============================================================================

-- 1. Habilitar extensiones requeridas (disponibles por defecto en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Eliminar job previo si existía
SELECT cron.unschedule('keepalive-backend-ping') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'keepalive-backend-ping'
);

-- 3. Programar consulta cada 12 horas (a las 00:00 y 12:00 UTC)
-- Esto realiza una petición HTTP hacia tu backend, el cual a su vez consulta PostgreSQL
SELECT cron.schedule(
    'keepalive-backend-ping',
    '0 0,12 * * *',
    $$
        SELECT net.http_get('https://gimapp.onrender.com/api/ping');
    $$
);

-- Para verificar que quedó activo el cron interno en Supabase:
-- SELECT * FROM cron.job;
