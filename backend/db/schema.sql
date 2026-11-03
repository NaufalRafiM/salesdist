-- ========================================================================
-- SALESDIST ID - RELATIONAL SQL DATABASE SCHEMA (DDL)
-- ========================================================================

-- 1. Table: areas
CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  nama_area TEXT NOT NULL,
  kode_area TEXT NOT NULL UNIQUE,
  deskripsi TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 2. Table: warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  nama_gudang TEXT NOT NULL,
  kode_gudang TEXT NOT NULL UNIQUE,
  alamat TEXT NOT NULL,
  area_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (area_id) REFERENCES areas(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 3. Table: brands
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  nama_brand TEXT NOT NULL,
  kode_brand TEXT NOT NULL UNIQUE,
  kategori TEXT NOT NULL,
  harga_satuan INTEGER NOT NULL CHECK (harga_satuan >= 0),
  deskripsi TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 4. Table: users (Admin & Sales PIC Field Officers with Biometric KYC)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nama_lengkap TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  no_whatsapp TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pic')),
  status_verifikasi TEXT NOT NULL CHECK (status_verifikasi IN ('pending', 'terverifikasi', 'ditolak')),
  
  -- Enterprise KYC & Biometric fields
  nik TEXT UNIQUE,
  nip_employee_id TEXT UNIQUE,
  ktp_photo_url TEXT,
  face_photo_url TEXT,
  address_domicile TEXT,
  assigned_area_id TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  integrity_pledge_agreed INTEGER NOT NULL DEFAULT 0,
  
  -- Audit verifikasi
  verified_at TEXT,
  verified_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  
  FOREIGN KEY (assigned_area_id) REFERENCES areas(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 5. Table: stok_gudang
CREATE TABLE IF NOT EXISTS stok_gudang (
  id TEXT PRIMARY KEY,
  warehouse_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  stok_tersedia INTEGER NOT NULL CHECK (stok_tersedia >= 0),
  stok_minimum INTEGER NOT NULL DEFAULT 10 CHECK (stok_minimum >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE(warehouse_id, brand_id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 6. Table: laporan_distribusi
CREATE TABLE IF NOT EXISTS laporan_distribusi (
  id TEXT PRIMARY KEY,
  nomor_laporan TEXT NOT NULL UNIQUE,
  pic_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  area_id TEXT NOT NULL,
  tanggal_laporan TEXT NOT NULL,
  periode_mulai TEXT NOT NULL,
  periode_selesai TEXT NOT NULL,
  catatan TEXT,
  status TEXT NOT NULL DEFAULT 'menunggu_verifikasi' CHECK (status IN ('menunggu_verifikasi', 'diterima', 'ditolak')),
  alasan_penolakan TEXT,
  verified_by TEXT,
  verified_at TEXT,
  total_penjualan INTEGER NOT NULL DEFAULT 0 CHECK (total_penjualan >= 0),
  total_unit INTEGER NOT NULL DEFAULT 0 CHECK (total_unit >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (pic_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (area_id) REFERENCES areas(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 7. Table: detail_penjualan
CREATE TABLE IF NOT EXISTS detail_penjualan (
  id TEXT PRIMARY KEY,
  laporan_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  jumlah_terjual INTEGER NOT NULL CHECK (jumlah_terjual > 0),
  harga_satuan INTEGER NOT NULL CHECK (harga_satuan >= 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  catatan_stok TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (laporan_id) REFERENCES laporan_distribusi(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 8. Table: pembayaran
CREATE TABLE IF NOT EXISTS pembayaran (
  id TEXT PRIMARY KEY,
  laporan_id TEXT NOT NULL UNIQUE,
  pic_id TEXT NOT NULL,
  total_tagihan INTEGER NOT NULL CHECK (total_tagihan >= 0),
  jumlah_dibayar INTEGER NOT NULL CHECK (jumlah_dibayar >= 0),
  metode_pembayaran TEXT NOT NULL CHECK (metode_pembayaran IN ('transfer_bank', 'giro', 'tunai')),
  nomor_referensi TEXT,
  bukti_transfer_url TEXT,
  status_pembayaran TEXT NOT NULL DEFAULT 'menunggu_konfirmasi' CHECK (status_pembayaran IN ('menunggu_konfirmasi', 'lunas', 'dibatalkan')),
  catatan_pembayaran TEXT,
  tanggal_pembayaran TEXT NOT NULL,
  verified_at TEXT,
  verified_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (laporan_id) REFERENCES laporan_distribusi(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (pic_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 9. Table: notifikasi
CREATE TABLE IF NOT EXISTS notifikasi (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  tipe TEXT NOT NULL CHECK (tipe IN ('info', 'sukses', 'peringatan', 'bahaya')),
  dibaca INTEGER NOT NULL DEFAULT 0,
  tautan_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 10. Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  aksi TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  entitas TEXT NOT NULL,
  entitas_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_laporan_pic ON laporan_distribusi(pic_id);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON laporan_distribusi(status);
CREATE INDEX IF NOT EXISTS idx_laporan_tanggal ON laporan_distribusi(tanggal_laporan);
CREATE INDEX IF NOT EXISTS idx_detail_laporan ON detail_penjualan(laporan_id);
CREATE INDEX IF NOT EXISTS idx_stok_warehouse ON stok_gudang(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifikasi(user_id, dibaca);
