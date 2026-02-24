-- ChurchShare PostgreSQL Initialization Script
-- This script runs automatically when the container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- Church Accounts Table
-- ===========================================
CREATE TABLE IF NOT EXISTS church_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for subdomain lookups
CREATE INDEX IF NOT EXISTS idx_church_accounts_subdomain ON church_accounts(subdomain);

-- ===========================================
-- Admin Users Table
-- ===========================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES church_accounts(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    display_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_admin_email_per_church UNIQUE (church_id, email)
);

-- Index for email lookups during authentication
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_church_id ON admin_users(church_id);

-- ===========================================
-- Document Slots Table (The Core Slot System)
-- ===========================================
CREATE TABLE IF NOT EXISTS document_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES church_accounts(id) ON DELETE CASCADE,
    slug VARCHAR(60) NOT NULL,
    display_title VARCHAR(255),
    current_file_key VARCHAR(512),
    file_size BIGINT,
    mime_type VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_slug_per_church UNIQUE (church_id, slug)
);

-- Index for slug lookups (viewer-facing URL resolution)
CREATE INDEX IF NOT EXISTS idx_document_slots_slug ON document_slots(slug);
CREATE INDEX IF NOT EXISTS idx_document_slots_church_id ON document_slots(church_id);
CREATE INDEX IF NOT EXISTS idx_document_slots_church_slug ON document_slots(church_id, slug);
CREATE INDEX IF NOT EXISTS idx_document_slots_is_active ON document_slots(is_active);

-- ===========================================
-- Audit Log Table (Optional - for tracking changes)
-- ===========================================
CREATE TABLE IF NOT EXISTS slot_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES document_slots(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE_FILE', 'UPDATE_SETTINGS', 'ARCHIVE'
    old_file_key VARCHAR(512),
    new_file_key VARCHAR(512),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit lookups by slot
CREATE INDEX IF NOT EXISTS idx_slot_audit_log_slot_id ON slot_audit_log(slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_audit_log_created_at ON slot_audit_log(created_at);

-- ===========================================
-- Trigger to auto-update updated_at timestamps
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to church_accounts
DROP TRIGGER IF EXISTS update_church_accounts_updated_at ON church_accounts;
CREATE TRIGGER update_church_accounts_updated_at
    BEFORE UPDATE ON church_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to admin_users
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to document_slots
DROP TRIGGER IF EXISTS update_document_slots_updated_at ON document_slots;
CREATE TRIGGER update_document_slots_updated_at
    BEFORE UPDATE ON document_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Insert a default church account for development
-- ===========================================
INSERT INTO church_accounts (id, name, subdomain)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Church', 'demo')
ON CONFLICT (id) DO NOTHING;

-- Insert a default admin user for development (password: admin123)
-- Password hash is BCrypt of 'admin123'
INSERT INTO admin_users (id, church_id, email, password_hash, role, display_name)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@demo.church',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    'Demo Admin'
)
ON CONFLICT (id) DO NOTHING;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'ChurchShare database initialized successfully!';
    RAISE NOTICE 'Schema: public';
    RAISE NOTICE 'Tables: church_accounts, admin_users, document_slots, slot_audit_log';
    RAISE NOTICE 'Extensions: uuid-ossp, pgcrypto';
    RAISE NOTICE 'Default church: demo (id: 00000000-0000-0000-0000-000000000001)';
    RAISE NOTICE 'Default admin: admin@demo.church / admin123';
END $$;
