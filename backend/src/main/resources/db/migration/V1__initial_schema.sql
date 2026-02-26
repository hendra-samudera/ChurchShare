-- V1__initial_schema.sql
-- ChurchShare Initial Database Schema
-- Applied: Initial deployment

-- Enable UUID extension for potential future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CHURCH TABLE (Tenant Root)
-- =============================================================================
CREATE TABLE church (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_church_slug ON church(slug);

-- =============================================================================
-- ADMIN_USER TABLE (Authentication)
-- =============================================================================
CREATE TABLE admin_user (
    id BIGSERIAL PRIMARY KEY,
    church_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_user_church FOREIGN KEY (church_id) REFERENCES church(id)
);

CREATE INDEX idx_admin_user_email ON admin_user(email);
CREATE INDEX idx_admin_user_church_id ON admin_user(church_id);

-- =============================================================================
-- DOCUMENT_SLOT TABLE (Core Slot Entity)
-- =============================================================================
CREATE TABLE document_slot (
    id BIGSERIAL PRIMARY KEY,
    church_id BIGINT NOT NULL,
    slug VARCHAR(100) NOT NULL,
    display_title VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    current_file_key VARCHAR(512),
    current_uploaded_at TIMESTAMPTZ,
    current_file_size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_slot_church FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    CONSTRAINT uq_document_slot_church_slug UNIQUE (church_id, slug),
    CONSTRAINT chk_document_slot_status CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DRAFT'))
);

CREATE INDEX idx_document_slot_church_id ON document_slot(church_id);
CREATE INDEX idx_document_slot_status ON document_slot(status);

-- =============================================================================
-- SLOT_FILE_VERSION TABLE (Audit Trail for File Versions)
-- =============================================================================
CREATE TABLE slot_file_version (
    id BIGSERIAL PRIMARY KEY,
    slot_id BIGINT NOT NULL,
    storage_key VARCHAR(512) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by BIGINT REFERENCES admin_user(id),

    CONSTRAINT fk_slot_file_version_slot FOREIGN KEY (slot_id) REFERENCES document_slot(id) ON DELETE CASCADE
);

CREATE INDEX idx_slot_file_version_slot_id ON slot_file_version(slot_id);
CREATE INDEX idx_slot_file_version_storage_key ON slot_file_version(storage_key);

-- =============================================================================
-- UPLOAD_AUDIT TABLE (Admin Action Audit Log)
-- =============================================================================
CREATE TABLE upload_audit (
    id BIGSERIAL PRIMARY KEY,
    slot_id BIGINT NOT NULL,
    admin_user_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_file_key VARCHAR(512),
    new_file_key VARCHAR(512),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_upload_audit_slot FOREIGN KEY (slot_id) REFERENCES document_slot(id) ON DELETE CASCADE,
    CONSTRAINT fk_upload_audit_admin FOREIGN KEY (admin_user_id) REFERENCES admin_user(id) ON DELETE CASCADE,
    CONSTRAINT chk_upload_audit_action CHECK (action IN ('CREATE', 'UPLOAD', 'REPLACE', 'DELETE', 'ARCHIVE', 'RESTORE'))
);

CREATE INDEX idx_upload_audit_slot_id ON upload_audit(slot_id);
CREATE INDEX idx_upload_audit_admin_user_id ON upload_audit(admin_user_id);
CREATE INDEX idx_upload_audit_performed_at ON upload_audit(performed_at);

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_church_updated_at
    BEFORE UPDATE ON church
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_admin_user_updated_at
    BEFORE UPDATE ON admin_user
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_document_slot_updated_at
    BEFORE UPDATE ON document_slot
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Seed Data (Development Only)
-- =============================================================================
-- Insert a default church for development
INSERT INTO church (id, name, slug, timezone) VALUES
    (1, 'Default Church', 'default-church', 'Asia/Jakarta')
ON CONFLICT (id) DO NOTHING;

-- Insert a default admin user for development (password: admin123)
-- Password is BCrypt hash of 'admin123'
INSERT INTO admin_user (id, church_id, email, password_hash, display_name, is_active) VALUES
    (1, 1, 'admin@churchshare.app', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin User', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample document slots for development
INSERT INTO document_slot (church_id, slug, display_title, status) VALUES
    (1, 'weekly-liturgy', 'Weekly Liturgy', 'ACTIVE'),
    (1, 'sunday-bulletin', 'Sunday Bulletin', 'ACTIVE'),
    (1, 'prayer-guide', 'Prayer Guide', 'ACTIVE')
ON CONFLICT DO NOTHING;
