-- ==============================================================================
-- SISTEM MANAJEMEN DISTRIBUSI & AKUNTANSI PENJUALAN LAPANGAN (SALESDIST ID)
-- SKEMA BASIS DATA RELASIONAL ENTERPRISE (POSTGRESQL / ANSI SQL-COMPLIANT)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'pic');
CREATE TYPE verification_status AS ENUM ('pending', 'terverifikasi', 'ditolak');
CREATE TYPE laporan_status AS ENUM ('Menunggu Verifikasi', 'Diterima', 'Ditolak');
CREATE TYPE payment_method AS ENUM ('tunai', 'QRIS', 'bank transfer');
CREATE TYPE payment_status AS ENUM ('Menunggu Verifikasi', 'Diterima', 'Ditolak');
CREATE TYPE stock_status AS ENUM ('aman', 'menipis', 'habis');

-- ==============================================================================
-- 3. TABEL WILAYAH & GUDANG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS areas (
    id VARCHAR(64) PRIMARY KEY,
    nama_kota_kabupaten VARCHAR(150) NOT NULL,
    region VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(64) PRIMARY KEY,
    nama_gudang VARCHAR(150) NOT NULL,
    lokasi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. TABEL PENGGUNA, KYC & BIOMETRIK PIC LAPANGAN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    nama_lengkap VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    no_whatsapp VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'pic',
    status_verifikasi verification_status NOT NULL DEFAULT 'pending',
    
    -- Berkas Identitas Resmi & KYC PIC
    nik VARCHAR(16) UNIQUE CHECK (nik IS NULL OR LENGTH(nik) = 16),
    nip_employee_id VARCHAR(50) UNIQUE,
    ktp_photo_url TEXT, -- Menyimpan URL dokumen foto e-KTP
    face_photo_url TEXT, -- Menyimpan URL foto biometrik wajah (selfie camera)
    address_domicile TEXT, -- Alamat domisili sesuai KTP
    assigned_area_id VARCHAR(64) REFERENCES areas(id) ON DELETE SET NULL,
    
    -- Kontak Darurat
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(30),
    emergency_contact_relation VARCHAR(50),
    
    -- Integritas & Audit Verifikasi Admin
    integrity_pledge_agreed BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nik ON users(nik);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status_verifikasi);

-- ==============================================================================
-- 5. TABEL MASTER BRAND & PRODUK
-- ==============================================================================
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(64) PRIMARY KEY,
    sku_code VARCHAR(50) NOT NULL UNIQUE,
    brand_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    base_price NUMERIC(15, 2) NOT NULL CHECK (base_price >= 0),
    description TEXT,
    unit VARCHAR(30) NOT NULL DEFAULT 'Pack',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. TABEL STOK GUDANG PER BRAND
-- ==============================================================================
CREATE TABLE IF NOT EXISTS stok_gudang (
    id VARCHAR(64) PRIMARY KEY,
    warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    brand_id VARCHAR(64) NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status stock_status NOT NULL DEFAULT 'aman',
    CONSTRAINT uq_warehouse_brand UNIQUE (warehouse_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_stok_warehouse ON stok_gudang(warehouse_id);

-- ==============================================================================
-- 7. TABEL LAPORAN PENJUALAN & DISTRIBUSI PIC
-- ==============================================================================
CREATE TABLE IF NOT EXISTS laporan_distribusi (
    id VARCHAR(64) PRIMARY KEY,
    nomor_laporan VARCHAR(50) NOT NULL UNIQUE,
    pic_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    area_id VARCHAR(64) NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    periode_mulai DATE NOT NULL,
    periode_selesai DATE NOT NULL,
    status laporan_status NOT NULL DEFAULT 'Menunggu Verifikasi',
    total_penjualan NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_penjualan >= 0),
    total_terjual_qty INTEGER NOT NULL DEFAULT 0 CHECK (total_terjual_qty >= 0),
    catatan_tambahan TEXT,
    catatan_penolakan TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_laporan_pic ON laporan_distribusi(pic_id);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON laporan_distribusi(status);
CREATE INDEX IF NOT EXISTS idx_laporan_created ON laporan_distribusi(created_at DESC);

-- ==============================================================================
-- 8. TABEL DETAIL PENJUALAN PER ITEM BRAND
-- ==============================================================================
CREATE TABLE IF NOT EXISTS detail_penjualan (
    id VARCHAR(64) PRIMARY KEY,
    laporan_id VARCHAR(64) NOT NULL REFERENCES laporan_distribusi(id) ON DELETE CASCADE,
    brand_id VARCHAR(64) NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    stok_awal INTEGER NOT NULL CHECK (stok_awal >= 0),
    terjual INTEGER NOT NULL CHECK (terjual >= 0),
    sample_bonus INTEGER NOT NULL DEFAULT 0 CHECK (sample_bonus >= 0),
    titip_toko INTEGER NOT NULL DEFAULT 0 CHECK (titip_toko >= 0),
    stok_akhir INTEGER NOT NULL CHECK (stok_akhir >= 0),
    base_price NUMERIC(15, 2) NOT NULL CHECK (base_price >= 0),
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    
    -- Formula Validasi Konsistensi Fisik: stok_akhir = stok_awal - terjual - sample_bonus - titip_toko
    CONSTRAINT chk_stock_balance CHECK (stok_akhir = stok_awal - terjual - sample_bonus - titip_toko)
);

CREATE INDEX IF NOT EXISTS idx_detail_laporan ON detail_penjualan(laporan_id);

-- ==============================================================================
-- 9. TABEL REKAPITULASI PEMBAYARAN & BUKTI TRANSFER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS pembayaran (
    id VARCHAR(64) PRIMARY KEY,
    laporan_id VARCHAR(64) NOT NULL UNIQUE REFERENCES laporan_distribusi(id) ON DELETE CASCADE,
    metode payment_method NOT NULL,
    bank_tujuan VARCHAR(100),
    nominal_transfer NUMERIC(15, 2) NOT NULL CHECK (nominal_transfer >= 0),
    status_pembayaran payment_status NOT NULL DEFAULT 'Menunggu Verifikasi',
    tanggal_tf TIMESTAMP WITH TIME ZONE NOT NULL,
    bukti_transfer_url TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_pembayaran_status ON pembayaran(status_pembayaran);

-- ==============================================================================
-- 10. TABEL NOTIFIKASI SISTEM
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifikasi (
    id VARCHAR(64) PRIMARY KEY,
    recipient_user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    recipient_role VARCHAR(20),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifikasi_user ON notifikasi(recipient_user_id, is_read);

-- ==============================================================================
-- 11. TABEL AUDIT LOG TRANSAKSI & PERUBAHAN STOK
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g. 'APPROVE_REPORT', 'REJECT_REPORT', 'VERIFY_PIC'
    entity_name VARCHAR(50) NOT NULL, -- e.g. 'laporan_distribusi', 'users', 'stok_gudang'
    entity_id VARCHAR(64) NOT NULL,
    payload_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
