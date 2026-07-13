-- Create Admin and Trainer Users
-- Password for both: password123
-- Hash generated using bcrypt (Laravel default)

-- Insert Trainer user
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
    'Panel Trainer',
    'trainer@fitness.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'trainer',
    NOW(),
    NOW()
);

-- Insert Admin user
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
    'Panel Admin',
    'admin@fitness.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'admin',
    NOW(),
    NOW()
);

-- Verify the users were created
SELECT id, name, email, role, created_at FROM users WHERE email IN ('trainer@fitness.com', 'admin@fitness.com');
