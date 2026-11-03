import { User, Area, Brand, Warehouse, StokGudang, LaporanDistribusi, AppNotification } from '../types';

const rawSvg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="580" viewBox="0 0 400 580">
  <rect width="400" height="580" fill="#f8fafc" rx="16"/>
  <rect x="15" y="15" width="370" height="550" fill="#ffffff" rx="12" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="200" cy="70" r="28" fill="#16a34a"/>
  <path d="M188 70 L196 78 L214 60" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="200" y="120" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">TRANSFER BERHASIL</text>
  <text x="200" y="140" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">24 Okt 2026, 11:20 WIB</text>
  <line x1="30" y1="160" x2="370" y2="160" stroke="#e2e8f0" stroke-dasharray="4,4"/>
  <text x="35" y="195" font-family="sans-serif" font-size="12" fill="#64748b">Bank Penerima</text>
  <text x="365" y="195" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">BCA - PT SALESDIST INDO</text>
  <text x="35" y="230" font-family="sans-serif" font-size="12" fill="#64748b">No. Rekening Tujuan</text>
  <text x="365" y="230" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">8820-1928-331</text>
  <text x="35" y="265" font-family="sans-serif" font-size="12" fill="#64748b">Pengirim</text>
  <text x="365" y="265" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">Ahmad Fauzi (PIC Lapangan)</text>
  <text x="35" y="300" font-family="sans-serif" font-size="12" fill="#64748b">No. Referensi</text>
  <text x="365" y="300" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">BCA-TRX-99827361</text>
  <line x1="30" y1="325" x2="370" y2="325" stroke="#e2e8f0"/>
  <text x="35" y="360" font-family="sans-serif" font-size="13" fill="#64748b">Total Nominal Transfer</text>
  <text x="365" y="360" font-family="sans-serif" font-size="20" font-weight="bold" fill="#1e3a8a" text-anchor="end">Rp 2.455.000</text>
  <rect x="30" y="390" width="340" height="90" fill="#f1f5f9" rx="8"/>
  <text x="45" y="415" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155">Berita Acara Distribusi:</text>
  <text x="45" y="440" font-family="sans-serif" font-size="11" fill="#475569">Setoran Distribusi Penjualan LPR-2026-001</text>
  <text x="45" y="460" font-family="sans-serif" font-size="11" fill="#475569">Area Bandung Raya &amp; Cimahi - Batch 1</text>
  <text x="200" y="525" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">Resi ini merupakan bukti sah pembayaran ke rekening resmi</text>
</svg>`;

const rawSvg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="580" viewBox="0 0 400 580">
  <rect width="400" height="580" fill="#f8fafc" rx="16"/>
  <rect x="15" y="15" width="370" height="550" fill="#ffffff" rx="12" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="135" y="45" width="130" height="38" fill="#0284c7" rx="6"/>
  <text x="200" y="70" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">BANK MANDIRI</text>
  <text x="200" y="115" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">BUKTI TRANSFER SETORAN</text>
  <text x="200" y="135" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">24 Okt 2026 - 10:15 WIB</text>
  <line x1="30" y1="155" x2="370" y2="155" stroke="#e2e8f0"/>
  <text x="35" y="190" font-family="sans-serif" font-size="12" fill="#64748b">Penyetor</text>
  <text x="365" y="190" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">Rian Pratama (PIC)</text>
  <text x="35" y="225" font-family="sans-serif" font-size="12" fill="#64748b">Rekening Penerima</text>
  <text x="365" y="225" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">Mandiri 130-00-998822-1</text>
  <text x="35" y="260" font-family="sans-serif" font-size="12" fill="#64748b">Status</text>
  <text x="365" y="260" font-family="sans-serif" font-size="12" font-weight="bold" fill="#059669" text-anchor="end">BERHASIL / SUKSES</text>
  <line x1="30" y1="285" x2="370" y2="285" stroke="#e2e8f0"/>
  <text x="35" y="325" font-family="sans-serif" font-size="13" fill="#64748b">Nominal Transfer</text>
  <text x="365" y="325" font-family="sans-serif" font-size="20" font-weight="bold" fill="#0284c7" text-anchor="end">Rp 1.855.000</text>
  <rect x="30" y="365" width="340" height="90" fill="#f8fafc" rx="8" stroke="#e2e8f0"/>
  <text x="45" y="395" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1e293b">Catatan PIC:</text>
  <text x="45" y="420" font-family="sans-serif" font-size="11" fill="#475569">Setoran Laporan LPR-2026-002 Jakarta Selatan</text>
  <text x="45" y="440" font-family="sans-serif" font-size="11" fill="#64748b">Semua toko retail di Cilandak selesai dikunjungi</text>
  <text x="200" y="515" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">PT SALESDIST DISTRIBUSI INDONESIA</text>
</svg>`;

export const SAMPLE_TRANSFER_RECEIPT_1 = `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(rawSvg1) : Buffer.from(rawSvg1).toString('base64')}`;
export const SAMPLE_TRANSFER_RECEIPT_2 = `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(rawSvg2) : Buffer.from(rawSvg2).toString('base64')}`;

// --- SAMPLE KYC DOCUMENTS & BIOMETRIC CAPTURES ---
const rawKtpSiti = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
  <defs>
    <linearGradient id="ktpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="40%" stop-color="#bfdbfe"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>
  </defs>
  <rect width="600" height="380" rx="16" fill="url(#ktpGrad)" stroke="#1e40af" stroke-width="2"/>
  <rect x="15" y="15" width="570" height="350" rx="12" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="6,4"/>
  <text x="300" y="42" font-family="sans-serif" font-size="14" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="2">REPUBLIK INDONESIA</text>
  <text x="300" y="62" font-family="sans-serif" font-size="12" font-weight="700" fill="#1e3a8a" text-anchor="middle" letter-spacing="1">PROVINSI JAWA TIMUR - KOTA SURABAYA</text>
  <line x1="40" y1="72" x2="560" y2="72" stroke="#1e3a8a" stroke-width="2"/>
  
  <text x="45" y="105" font-family="monospace" font-size="15" font-weight="900" fill="#0f172a">NIK          :  3578 0165 0898 0004</text>
  <text x="45" y="135" font-family="sans-serif" font-size="11" font-weight="700" fill="#0f172a">Nama         :  SITI NURHALIZA</text>
  <text x="45" y="158" font-family="sans-serif" font-size="10" font-weight="600" fill="#1e293b">Tempat/Tgl Lahir :  SURABAYA, 15-08-1998</text>
  <text x="45" y="180" font-family="sans-serif" font-size="10" font-weight="600" fill="#1e293b">Jenis Kelamin    :  PEREMPUAN</text>
  <text x="45" y="202" font-family="sans-serif" font-size="10" font-weight="600" fill="#1e293b">Alamat       :  JL. KERTAJAYA INDAH NO. 42</text>
  <text x="80" y="222" font-family="sans-serif" font-size="10" font-weight="600" fill="#1e293b">RT/RW        :  004 / 008, GUBENG</text>
  <text x="45" y="244" font-family="sans-serif" font-size="10" font-weight="600" fill="#1e293b">Agama        :  ISLAM</text>
  <text x="45" y="266" font-family="sans-serif" font-size="10" font-weight="600" fill="#1e293b">Status Kawin :  BELUM KAWIN</text>
  <text x="45" y="288" font-family="sans-serif" font-size="10" font-weight="600" fill="#1e293b">Pekerjaan    :  SALES PIC LAPANGAN</text>
  <text x="45" y="310" font-family="sans-serif" font-size="10" font-weight="600" fill="#1e293b">Kewarganegaraan :  WNI</text>
  <text x="45" y="332" font-family="sans-serif" font-size="10" font-weight="700" fill="#15803d">Berlaku Hingga :  SEUMUR HIDUP</text>

  <!-- Photo Box -->
  <rect x="440" y="90" width="125" height="165" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <rect x="440" y="90" width="125" height="165" rx="8" fill="#0284c7" opacity="0.15"/>
  <circle cx="502" cy="150" r="32" fill="#0284c7"/>
  <path d="M465 235 C465 195 540 195 540 235 Z" fill="#0284c7"/>
  <rect x="440" y="235" width="125" height="20" fill="#0369a1" rx="0 0 8 8"/>
  <text x="502" y="250" font-family="sans-serif" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">e-KTP RESMI</text>
  
  <text x="502" y="275" font-family="sans-serif" font-size="9" fill="#1e3a8a" text-anchor="middle">SURABAYA</text>
  <text x="502" y="288" font-family="sans-serif" font-size="8" fill="#475569" text-anchor="middle">TTE DUKCAPIL</text>
  <rect x="450" y="300" width="105" height="28" fill="#ffffff" stroke="#94a3b8" stroke-dasharray="2,2"/>
  <text x="502" y="318" font-family="monospace" font-size="9" font-weight="bold" fill="#0f172a" text-anchor="middle">[CHIP TERVALIDASI]</text>
</svg>`;

const rawFaceSiti = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" rx="16" fill="#0f172a"/>
  <!-- Biometric Scanner Overlay -->
  <circle cx="200" cy="180" r="110" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="8,6"/>
  <circle cx="200" cy="180" r="85" fill="none" stroke="#10b981" stroke-width="1.5"/>
  
  <!-- Corner Targeting Brackets -->
  <path d="M 50 80 L 50 50 L 80 50" stroke="#38bdf8" stroke-width="3" fill="none"/>
  <path d="M 350 80 L 350 50 L 320 50" stroke="#38bdf8" stroke-width="3" fill="none"/>
  <path d="M 50 320 L 50 350 L 80 350" stroke="#38bdf8" stroke-width="3" fill="none"/>
  <path d="M 350 320 L 350 350 L 320 350" stroke="#38bdf8" stroke-width="3" fill="none"/>

  <!-- Face Avatar -->
  <circle cx="200" cy="165" r="55" fill="#38bdf8"/>
  <circle cx="180" cy="155" r="6" fill="#0f172a"/>
  <circle cx="220" cy="155" r="6" fill="#0f172a"/>
  <path d="M 185 185 Q 200 198 215 185" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M 130 300 C 130 230 270 230 270 300 Z" fill="#0284c7"/>

  <!-- Biometric Scanning HUD -->
  <line x1="70" y1="180" x2="330" y2="180" stroke="#10b981" stroke-width="2" opacity="0.8"/>
  <rect x="70" y="325" width="260" height="45" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
  <text x="200" y="345" font-family="monospace" font-size="11" font-weight="bold" fill="#10b981" text-anchor="middle">BIOMETRIK WAJAH 99.4% COCOK</text>
  <text x="200" y="360" font-family="sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">Liveness Detected &bull; Anti-Spoof Passed</text>
</svg>`;

const rawFaceFauzi = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" rx="16" fill="#0f172a"/>
  <circle cx="200" cy="180" r="110" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="8,6"/>
  <path d="M 50 80 L 50 50 L 80 50" stroke="#38bdf8" stroke-width="3" fill="none"/>
  <path d="M 350 80 L 350 50 L 320 50" stroke="#38bdf8" stroke-width="3" fill="none"/>
  <path d="M 50 320 L 50 350 L 80 350" stroke="#38bdf8" stroke-width="3" fill="none"/>
  <path d="M 350 320 L 350 350 L 320 350" stroke="#38bdf8" stroke-width="3" fill="none"/>
  
  <circle cx="200" cy="160" r="55" fill="#f59e0b"/>
  <circle cx="180" cy="150" r="6" fill="#0f172a"/>
  <circle cx="220" cy="150" r="6" fill="#0f172a"/>
  <path d="M 185 180 Q 200 192 215 180" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M 130 300 C 130 230 270 230 270 300 Z" fill="#d97706"/>

  <rect x="70" y="325" width="260" height="45" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
  <text x="200" y="345" font-family="monospace" font-size="11" font-weight="bold" fill="#10b981" text-anchor="middle">VERIFIKASI WAJAH TEREKAM</text>
  <text x="200" y="360" font-family="sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">ID: PIC-DIST-2026-BDG01</text>
</svg>`;

export const SAMPLE_KTP_PHOTO = `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(rawKtpSiti) : Buffer.from(rawKtpSiti).toString('base64')}`;
export const SAMPLE_FACE_PHOTO_SITI = `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(rawFaceSiti) : Buffer.from(rawFaceSiti).toString('base64')}`;
export const SAMPLE_FACE_PHOTO_FAUZI = `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(rawFaceFauzi) : Buffer.from(rawFaceFauzi).toString('base64')}`;

import { hashPasswordSync } from '../utils/crypto';

export const SEED_USERS: User[] = [
  {
    id: 'usr-admin-1',
    nama_lengkap: 'Budi Santoso',
    email: 'admin@salesdist.id',
    no_whatsapp: '081299887766',
    password_hash: hashPasswordSync('admin123'),
    role: 'admin',
    status_verifikasi: 'terverifikasi',
    created_at: '2026-01-10T08:00:00Z',
    nik: '3171011504850001',
    nip_employee_id: 'ADM-DIST-001',
    address_domicile: 'Jl. Pegangsaan Timur No. 12, Menteng, Jakarta Pusat',
    integrity_pledge_agreed: true,
  },
  {
    id: 'usr-pic-1',
    nama_lengkap: 'Ahmad Fauzi',
    email: 'fauzi@salesdist.id',
    no_whatsapp: '081234567890',
    password_hash: hashPasswordSync('password123'),
    role: 'pic',
    status_verifikasi: 'terverifikasi',
    created_at: '2026-02-01T09:15:00Z',
    nik: '3273011204920002',
    nip_employee_id: 'PIC-DIST-2026-001',
    ktp_photo_url: SAMPLE_KTP_PHOTO,
    face_photo_url: SAMPLE_FACE_PHOTO_FAUZI,
    address_domicile: 'Jl. Riau No. 15, Bandung Wetan, Kota Bandung',
    assigned_area_id: 'area-1',
    emergency_contact_name: 'Dewi Rahmawati',
    emergency_contact_phone: '081299881122',
    emergency_contact_relation: 'Istri',
    integrity_pledge_agreed: true,
    verified_at: '2026-02-02T10:00:00Z',
    verified_by: 'Budi Santoso (Admin)',
  },
  {
    id: 'usr-pic-2',
    nama_lengkap: 'Rian Pratama',
    email: 'rian@salesdist.id',
    no_whatsapp: '081345678901',
    password_hash: hashPasswordSync('password123'),
    role: 'pic',
    status_verifikasi: 'terverifikasi',
    created_at: '2026-02-15T11:30:00Z',
    nik: '3174022806940003',
    nip_employee_id: 'PIC-DIST-2026-002',
    ktp_photo_url: SAMPLE_KTP_PHOTO,
    face_photo_url: SAMPLE_FACE_PHOTO_FAUZI,
    address_domicile: 'Jl. Fatmawati Raya No. 88, Cilandak, Jakarta Selatan',
    assigned_area_id: 'area-2',
    emergency_contact_name: 'Bambang Pratama',
    emergency_contact_phone: '081377889900',
    emergency_contact_relation: 'Ayah Kandung',
    integrity_pledge_agreed: true,
    verified_at: '2026-02-16T09:00:00Z',
    verified_by: 'Budi Santoso (Admin)',
  },
  {
    id: 'usr-pic-3',
    nama_lengkap: 'Siti Nurhaliza',
    email: 'siti@salesdist.id',
    no_whatsapp: '081456789012',
    password_hash: hashPasswordSync('password123'),
    role: 'pic',
    status_verifikasi: 'pending',
    created_at: '2026-10-23T14:20:00Z',
    nik: '3578016508980004',
    nip_employee_id: 'PIC-DIST-2026-003',
    ktp_photo_url: SAMPLE_KTP_PHOTO,
    face_photo_url: SAMPLE_FACE_PHOTO_SITI,
    address_domicile: 'Jl. Kertajaya Indah No. 42, Gubeng, Surabaya',
    assigned_area_id: 'area-3',
    emergency_contact_name: 'Hj. Aminah Nurhaliza',
    emergency_contact_phone: '081512349988',
    emergency_contact_relation: 'Ibu Kandung',
    integrity_pledge_agreed: true,
  },
];

export const SEED_AREAS: Area[] = [
  {
    id: 'area-1',
    nama_kota_kabupaten: 'Bandung Raya & Cimahi',
    region: 'Jawa Barat',
  },
  {
    id: 'area-2',
    nama_kota_kabupaten: 'Jakarta Selatan & Depok',
    region: 'DKI Jakarta',
  },
  {
    id: 'area-3',
    nama_kota_kabupaten: 'Surabaya Pusat & Timur',
    region: 'Jawa Timur',
  },
  {
    id: 'area-4',
    nama_kota_kabupaten: 'Semarang Kota & Ungaran',
    region: 'Jawa Tengah',
  },
  {
    id: 'area-5',
    nama_kota_kabupaten: 'Medan Kota & Deli Serdang',
    region: 'Sumatera Utara',
  },
  {
    id: 'area-boyolali',
    nama_kota_kabupaten: 'Kab. Boyolali',
    region: 'Jawa Tengah',
  },
];

export const SEED_BRANDS: Brand[] = [
  {
    id: 'brd-1',
    sku_code: 'TTM-001',
    brand_name: 'Teh Tarik Mantap',
    category: 'Minuman Siap Minum',
    base_price: 8500,
    description: 'Teh tarik kemasan botol siap saji dengan aroma teh melati khas.',
    unit: 'Pack',
  },
  {
    id: 'brd-2',
    sku_code: 'KTG-002',
    brand_name: 'Kopi Tubruk Gayo 250g',
    category: 'Kopi & Teh Bubuk',
    base_price: 22000,
    description: 'Kopi robusta & arabika premium pilihan dataran tinggi Aceh.',
    unit: 'Pack',
  },
  {
    id: 'brd-3',
    sku_code: 'KSP-003',
    brand_name: 'Keripik Singkong Balado',
    category: 'Makanan Ringan',
    base_price: 14000,
    description: 'Keripik singkong renyah dengan cabai merah asli tanpa pengawet.',
    unit: 'Pack',
  },
  {
    id: 'brd-4',
    sku_code: 'BCR-004',
    brand_name: 'Biskuit Cokelat Renyah',
    category: 'Makanan Ringan',
    base_price: 9500,
    description: 'Biskuit isi krim cokelat pekat cocok untuk camilan harian.',
    unit: 'Pack',
  },
  {
    id: 'brd-5',
    sku_code: 'AMP-005',
    brand_name: 'Air Mineral Pegunungan 600ml',
    category: 'Minuman Segar',
    base_price: 4000,
    description: 'Air minum alami higienis sumber mata air pegunungan asri.',
    unit: 'Pack',
  },
  {
    id: 'brd-6',
    sku_code: 'SBS-006',
    brand_name: 'Sambal Bawang Spesial 200g',
    category: 'Bumbu & Saus',
    base_price: 18500,
    description: 'Sambal bawang uleg segar dengan minyak kelapa pilihan.',
    unit: 'Pack',
  },
  {
    id: 'brd-otk-12',
    sku_code: 'OTK-012',
    brand_name: 'Otentik 12',
    category: 'Rokok & Sigaret',
    base_price: 16500,
    description: 'Sigaret Kretek Otentik 12 batang kemasan pack.',
    unit: 'Pack',
  },
  {
    id: 'brd-otk-16',
    sku_code: 'OTK-016',
    brand_name: 'Otentik 16',
    category: 'Rokok & Sigaret',
    base_price: 21000,
    description: 'Sigaret Kretek Otentik 16 batang kemasan pack.',
    unit: 'Pack',
  },
  {
    id: 'brd-mgb-12',
    sku_code: 'MBL-012',
    brand_name: 'Mag. Blewah 12',
    category: 'Rokok & Sigaret',
    base_price: 15000,
    description: 'Sigaret Rasa Mag. Blewah 12 batang aroma manis segar.',
    unit: 'Pack',
  },
  {
    id: 'brd-mgb-16',
    sku_code: 'MBL-016',
    brand_name: 'Mag. Blewah 16',
    category: 'Rokok & Sigaret',
    base_price: 19500,
    description: 'Sigaret Rasa Mag. Blewah 16 batang mantap.',
    unit: 'Pack',
  },
];

export const SEED_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    nama_gudang: 'Gudang Utama Cakung (Pusat)',
    lokasi: 'Jl. Raya Cakung Cilincing KM 2, Jakarta Timur',
  },
  {
    id: 'wh-2',
    nama_gudang: 'Gudang Hub Bandung & Priangan',
    lokasi: 'Kawasan Industri Cimahi Blok C-12, Jawa Barat',
  },
];

export const SEED_STOK_GUDANG: StokGudang[] = [
  // Warehouse 1 (Cakung)
  { id: 'stk-1', warehouse_id: 'wh-1', brand_id: 'brd-1', current_stock: 1420, last_updated: '2026-10-24T08:00:00Z', status: 'aman' },
  { id: 'stk-2', warehouse_id: 'wh-1', brand_id: 'brd-2', current_stock: 650, last_updated: '2026-10-24T08:00:00Z', status: 'aman' },
  { id: 'stk-3', warehouse_id: 'wh-1', brand_id: 'brd-3', current_stock: 45, last_updated: '2026-10-24T08:00:00Z', status: 'menipis' },
  { id: 'stk-4', warehouse_id: 'wh-1', brand_id: 'brd-4', current_stock: 890, last_updated: '2026-10-24T08:00:00Z', status: 'aman' },
  { id: 'stk-5', warehouse_id: 'wh-1', brand_id: 'brd-5', current_stock: 2100, last_updated: '2026-10-24T08:00:00Z', status: 'aman' },
  { id: 'stk-6', warehouse_id: 'wh-1', brand_id: 'brd-6', current_stock: 0, last_updated: '2026-10-24T08:00:00Z', status: 'habis' },

  // Warehouse 2 (Bandung)
  { id: 'stk-7', warehouse_id: 'wh-2', brand_id: 'brd-1', current_stock: 780, last_updated: '2026-10-24T08:00:00Z', status: 'aman' },
  { id: 'stk-8', warehouse_id: 'wh-2', brand_id: 'brd-2', current_stock: 310, last_updated: '2026-10-24T08:00:00Z', status: 'aman' },
  { id: 'stk-9', warehouse_id: 'wh-2', brand_id: 'brd-3', current_stock: 520, last_updated: '2026-10-24T08:00:00Z', status: 'aman' },
  { id: 'stk-10', warehouse_id: 'wh-2', brand_id: 'brd-4', current_stock: 35, last_updated: '2026-10-24T08:00:00Z', status: 'menipis' },
  { id: 'stk-11', warehouse_id: 'wh-2', brand_id: 'brd-5', current_stock: 1200, last_updated: '2026-10-24T08:00:00Z', status: 'aman' },
  { id: 'stk-12', warehouse_id: 'wh-2', brand_id: 'brd-6', current_stock: 240, last_updated: '2026-10-24T08:00:00Z', status: 'aman' },
];

export const SEED_LAPORAN: LaporanDistribusi[] = [
  // 1. Report: Diterima
  {
    id: 'lpr-001',
    nomor_laporan: 'LPR-2026-001',
    pic_id: 'usr-pic-1',
    area_id: 'area-1',
    warehouse_id: 'wh-2',
    periode_mulai: '2026-10-18',
    periode_selesai: '2026-10-22',
    catatan_tambahan: 'Distribusi rute Pasteur, Dago, dan Setiabudhi lancar. Toko antusias dengan promo Teh Tarik.',
    status: 'Diterima',
    created_at: '2026-10-22T16:00:00Z',
    updated_at: '2026-10-23T09:00:00Z',
    details: [
      {
        id: 'det-1',
        laporan_id: 'lpr-001',
        brand_id: 'brd-1',
        stok_awal: 150,
        terjual: 110,
        sample_bonus: 10,
        titip_toko: 20,
        stok_akhir: 10,
        base_price: 8500,
        subtotal: 935000,
      },
      {
        id: 'det-2',
        laporan_id: 'lpr-001',
        brand_id: 'brd-2',
        stok_awal: 80,
        terjual: 50,
        sample_bonus: 5,
        titip_toko: 15,
        stok_akhir: 10,
        base_price: 22000,
        subtotal: 1100000,
      },
      {
        id: 'det-3',
        laporan_id: 'lpr-001',
        brand_id: 'brd-5',
        stok_awal: 150,
        terjual: 105,
        sample_bonus: 10,
        titip_toko: 20,
        stok_akhir: 15,
        base_price: 4000,
        subtotal: 420000,
      },
    ],
    pembayaran: {
      id: 'pay-1',
      laporan_id: 'lpr-001',
      metode: 'bank transfer',
      bank_tujuan: 'BCA (PT Salesdist Indo)',
      nominal_transfer: 2455000,
      tanggal_tf: '2026-10-22',
      bukti_transfer_url: SAMPLE_TRANSFER_RECEIPT_1,
      status: 'Diterima',
      verified_by: 'usr-admin-1',
      verified_at: '2026-10-23T09:00:00Z',
    },
  },

  // 2. Report: Menunggu Verifikasi
  {
    id: 'lpr-002',
    nomor_laporan: 'LPR-2026-002',
    pic_id: 'usr-pic-2',
    area_id: 'area-2',
    warehouse_id: 'wh-1',
    periode_mulai: '2026-10-20',
    periode_selesai: '2026-10-23',
    catatan_tambahan: 'Semua toko retail di Cilandak dan Kemang sudah dikunjungi. Pembayaran melalui QRIS langsung ke kasir toko.',
    status: 'Menunggu Verifikasi',
    created_at: '2026-10-23T17:45:00Z',
    updated_at: '2026-10-23T17:45:00Z',
    details: [
      {
        id: 'det-4',
        laporan_id: 'lpr-002',
        brand_id: 'brd-3',
        stok_awal: 120,
        terjual: 85,
        sample_bonus: 5,
        titip_toko: 20,
        stok_akhir: 10,
        base_price: 14000,
        subtotal: 1190000,
      },
      {
        id: 'det-5',
        laporan_id: 'lpr-002',
        brand_id: 'brd-4',
        stok_awal: 100,
        terjual: 70,
        sample_bonus: 5,
        titip_toko: 15,
        stok_akhir: 10,
        base_price: 9500,
        subtotal: 665000,
      },
    ],
    pembayaran: {
      id: 'pay-2',
      laporan_id: 'lpr-002',
      metode: 'QRIS',
      nominal_transfer: 1855000,
      tanggal_tf: '2026-10-23',
      status: 'Menunggu Verifikasi',
    },
  },

  // 3. Report: Ditolak (Requires revision from PIC)
  {
    id: 'lpr-003',
    nomor_laporan: 'LPR-2026-003',
    pic_id: 'usr-pic-1',
    area_id: 'area-1',
    warehouse_id: 'wh-2',
    periode_mulai: '2026-10-15',
    periode_selesai: '2026-10-17',
    catatan_tambahan: 'Pengiriman toko grosir Leuwi Panjang.',
    status: 'Ditolak',
    rejection_reason: 'Nominal pada bukti transfer (Rp 950.000) tidak sesuai dengan total tagihan penjualan (Rp 1.150.000). Harap lampirkan bukti pelunasan sisa kekurangan Rp 200.000.',
    created_at: '2026-10-17T18:00:00Z',
    updated_at: '2026-10-18T10:15:00Z',
    details: [
      {
        id: 'det-6',
        laporan_id: 'lpr-003',
        brand_id: 'brd-6',
        stok_awal: 80,
        terjual: 50,
        sample_bonus: 5,
        titip_toko: 15,
        stok_akhir: 10,
        base_price: 18500,
        subtotal: 925000,
      },
    ],
    pembayaran: {
      id: 'pay-3',
      laporan_id: 'lpr-003',
      metode: 'bank transfer',
      bank_tujuan: 'Mandiri (PT Salesdist Indo)',
      nominal_transfer: 950000,
      tanggal_tf: '2026-10-17',
      bukti_transfer_url: SAMPLE_TRANSFER_RECEIPT_2,
      status: 'Ditolak',
      verified_by: 'usr-admin-1',
      verified_at: '2026-10-18T10:15:00Z',
    },
  },
  {
    id: 'lpr-004',
    nomor_laporan: 'LPR-2026-004',
    pic_id: 'usr-pic-1',
    area_id: 'area-boyolali',
    warehouse_id: 'wh-1',
    periode_mulai: '2026-10-21',
    periode_selesai: '2026-10-24',
    catatan_tambahan: 'Distribusi rokok Otentik 12 & Mag. Blewah 12 toko kelontong Boyolali Kota berjalan lancar. Setoran transfer BCA.',
    status: 'Menunggu Verifikasi',
    created_at: '2026-10-24T14:30:00Z',
    updated_at: '2026-10-24T14:30:00Z',
    details: [
      {
        id: 'det-7',
        laporan_id: 'lpr-004',
        brand_id: 'brd-otk-12',
        stok_awal: 100,
        titip_toko: 15,
        sample_bonus: 5,
        terjual: 70,
        stok_akhir: 10,
        base_price: 16500,
        subtotal: 1155000,
      },
      {
        id: 'det-8',
        laporan_id: 'lpr-004',
        brand_id: 'brd-mgb-12',
        stok_awal: 50,
        titip_toko: 10,
        sample_bonus: 2,
        terjual: 33,
        stok_akhir: 5,
        base_price: 15000,
        subtotal: 495000,
      },
    ],
    pembayaran: {
      id: 'pay-4',
      laporan_id: 'lpr-004',
      metode: 'bank transfer',
      bank_tujuan: 'BCA (PT Salesdist Indo - 88201928331)',
      nominal_transfer: 1650000,
      tanggal_tf: '2026-10-24',
      bukti_transfer_url: SAMPLE_TRANSFER_RECEIPT_1,
      status: 'Menunggu Verifikasi',
    },
  },
];

export const SEED_NOTIFIKASI: AppNotification[] = [
  {
    id: 'notif-1',
    recipient_role: 'admin',
    title: 'Laporan Baru Masuk',
    message: 'PIC Rian Pratama mengirim laporan distribusi LPR-2026-002 untuk Area Jakarta Selatan (Menunggu Verifikasi).',
    type: 'info',
    is_read: false,
    laporan_id: 'lpr-002',
    created_at: '2026-10-23T17:45:00Z',
  },
  {
    id: 'notif-2',
    recipient_user_id: 'usr-pic-1',
    title: 'Laporan Diterima & Disetujui',
    message: 'Laporan LPR-2026-001 (Area Bandung Raya) telah disetujui oleh Admin Budi Santoso.',
    type: 'success',
    is_read: true,
    laporan_id: 'lpr-001',
    created_at: '2026-10-23T09:00:00Z',
  },
  {
    id: 'notif-3',
    recipient_user_id: 'usr-pic-1',
    title: 'Laporan Ditolak - Butuh Revisi',
    message: 'Laporan LPR-2026-003 ditolak oleh Admin. Alasan: Nominal pada bukti transfer tidak sesuai. Silakan lakukan revisi.',
    type: 'error',
    is_read: false,
    laporan_id: 'lpr-003',
    created_at: '2026-10-18T10:15:00Z',
  },
];
