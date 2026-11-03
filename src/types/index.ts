export type UserRole = 'admin' | 'pic';
export type VerificationStatus = 'pending' | 'terverifikasi' | 'ditolak';

export interface User {
  id: string;
  nama_lengkap: string;
  email: string;
  no_whatsapp: string;
  password_hash: string;
  role: UserRole;
  status_verifikasi: VerificationStatus;
  created_at: string;
  // Formal KYC & Biometric fields for PIC
  nik?: string; // 16 digit NIK KTP
  nip_employee_id?: string; // NIP Karyawan PIC / Mitra Lapangan
  ktp_photo_url?: string; // Data URL / Photo of official KTP
  face_photo_url?: string; // Biometric Face Capture / Selfie URL
  address_domicile?: string; // Alamat Domisili Sesuai KTP
  assigned_area_id?: string; // Area Penugasan Distribusi
  emergency_contact_name?: string; // Nama Kontak Darurat
  emergency_contact_phone?: string; // No HP Kontak Darurat
  emergency_contact_relation?: string; // Hubungan (Orang Tua, Pasangan, Saudara)
  integrity_pledge_agreed?: boolean; // Pakta Integritas & Kepatuhan Distribusi
  verified_at?: string; // Tanggal verifikasi admin
  verified_by?: string; // Admin yang memverifikasi
}

export interface Area {
  id: string;
  nama_kota_kabupaten: string;
  region: string;
}

export interface Brand {
  id: string;
  sku_code: string;
  brand_name: string;
  category: string;
  base_price: number;
  description: string;
  unit: string; // e.g. "Pack"
}

export interface Warehouse {
  id: string;
  nama_gudang: string;
  lokasi: string;
}

export interface StokGudang {
  id: string;
  warehouse_id: string;
  brand_id: string;
  current_stock: number;
  last_updated: string;
  status: 'aman' | 'menipis' | 'habis';
}

export type LaporanStatus = 'Menunggu Verifikasi' | 'Diterima' | 'Ditolak';
export type PaymentMethod = 'tunai' | 'QRIS' | 'bank transfer';

export interface DetailPenjualan {
  id: string;
  laporan_id: string;
  brand_id: string;
  stok_awal: number;
  terjual: number;
  sample_bonus: number;
  titip_toko: number;
  stok_akhir: number;
  base_price: number;
  subtotal: number; // terjual * base_price
}

export interface Pembayaran {
  id: string;
  laporan_id: string;
  metode: PaymentMethod;
  bank_tujuan?: string;
  nominal_transfer: number;
  tanggal_tf: string;
  bukti_transfer_url?: string;
  status: LaporanStatus;
  verified_by?: string;
  verified_at?: string;
}

export interface LaporanDistribusi {
  id: string;
  nomor_laporan: string; // e.g. "LPR-2026-001"
  pic_id: string;
  area_id: string;
  warehouse_id: string;
  periode_mulai: string;
  periode_selesai: string;
  catatan_tambahan: string;
  status: LaporanStatus;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  details?: DetailPenjualan[];
  pembayaran?: Pembayaran;
}

export interface AppNotification {
  id: string;
  recipient_role?: UserRole;
  recipient_user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  laporan_id?: string;
  created_at: string;
}
