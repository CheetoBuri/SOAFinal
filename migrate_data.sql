-- PostgreSQL Data Migration from SQLite

-- Insert user data
INSERT INTO users (id, email, username, password_hash, full_name, phone, balance, created_at) 
VALUES ('1', 'huynhnhattien0411@gmail.com', 'hnt_4', '60616f663978719dbbad04dae8af97004b8ca0b9cd9e6c224fa1575a61f635e6', 'Huynh Nhat Tien', '0789925752', 749000.0, '2025-12-05 19:16:57')
ON CONFLICT (id) DO NOTHING;

-- Note: OTP codes are temporary, no need to migrate

-- Orders will need manual conversion due to JSONB format
-- This is a placeholder - actual orders need to be extracted from SQLite
