-- Script SQL para agregar columnas faltantes a la tabla subscriptions
-- Este script se puede ejecutar directamente sin perder datos

-- Agregar columna payment_method
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255) NULL;

-- Agregar columna payment_receipt
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_receipt VARCHAR(255) NULL;

-- Agregar columna card_data
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS card_data TEXT NULL;

-- Agregar columna approved_by (foreign key a users)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS approved_by BIGINT NULL;

-- Agregar columna approved_at
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;

-- Agregar columna rejection_reason
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;

-- Agregar constraint de foreign key para approved_by si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_approved_by_foreign'
    ) THEN
        ALTER TABLE subscriptions
        ADD CONSTRAINT subscriptions_approved_by_foreign
        FOREIGN KEY (approved_by) REFERENCES users(id);
    END IF;
END $$;

-- Cambiar el default de status si es necesario
ALTER TABLE subscriptions 
ALTER COLUMN status SET DEFAULT 'pending';

-- Hacer starts_at y ends_at nullable si no lo son
ALTER TABLE subscriptions 
ALTER COLUMN starts_at DROP NOT NULL;

ALTER TABLE subscriptions 
ALTER COLUMN ends_at DROP NOT NULL;

-- Resultado
SELECT 'Columnas agregadas exitosamente' as mensaje;
