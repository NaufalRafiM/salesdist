import React, { useState } from 'react';
import {
  Users,
  Package,
  MapPin,
  Warehouse,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
  X,
  CreditCard,
  Camera,
  FileText,
  Database,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { store } from '../../db/store';
import { User, Brand, Area, Warehouse as WarehouseType } from '../../types';
import { formatRupiah, formatDateID } from '../../utils/calc';

export const MasterDataView: React.FC = () => {
  const db = store.getState();
  const users = db.users;
  const brands = db.brands;
  const areas = db.areas;
  const warehouses = db.warehouses;

  const [activeTab, setActiveTab] = useState<'users' | 'brand' | 'area' | 'gudang' | 'sql'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  // KYC Inspection Modal
  const [viewingKycUser, setViewingKycUser] = useState<User | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Brand Modals
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState({ sku: '', name: '', cat: 'Minuman', price: '', unit: 'Pack' });

  // Area Modals
  const [showAddArea, setShowAddArea] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaForm, setAreaForm] = useState({ name: '', region: 'Jawa Barat' });

  // Warehouse Modals
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [warehouseForm, setWarehouseForm] = useState({ name: '', location: '' });

  // User Modals
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'pic' as 'admin' | 'pic',
    status: 'terverifikasi' as 'pending' | 'terverifikasi' | 'ditolak',
  });

  // --- BRAND HANDLERS ---
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.sku.trim() || !brandForm.name.trim() || !brandForm.price) return;

    if (editingBrand) {
      store.updateBrand(editingBrand.id, {
        sku_code: brandForm.sku.trim().toUpperCase(),
        brand_name: brandForm.name.trim(),
        category: brandForm.cat,
        base_price: Number(brandForm.price),
        unit: brandForm.unit,
      });
      setEditingBrand(null);
    } else {
      store.addBrand({
        sku_code: brandForm.sku.trim().toUpperCase(),
        brand_name: brandForm.name.trim(),
        category: brandForm.cat,
        base_price: Number(brandForm.price),
        description: `Produk ${brandForm.name.trim()}`,
        unit: brandForm.unit,
      });
      setShowAddBrand(false);
    }
    setBrandForm({ sku: '', name: '', cat: 'Minuman', price: '', unit: 'Pack' });
  };

  const handleDeleteBrand = (id: string, name: string) => {
    store.deleteBrand(id);
  };

  // --- AREA HANDLERS ---
  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaForm.name.trim()) return;

    if (editingArea) {
      store.updateArea(editingArea.id, {
        nama_kota_kabupaten: areaForm.name.trim(),
        region: areaForm.region,
      });
      setEditingArea(null);
    } else {
      store.addArea({
        nama_kota_kabupaten: areaForm.name.trim(),
        region: areaForm.region,
      });
      setShowAddArea(false);
    }
    setAreaForm({ name: '', region: 'Jawa Barat' });
  };

  const handleDeleteArea = (id: string) => {
    store.deleteArea(id);
  };

  // --- WAREHOUSE HANDLERS ---
  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseForm.name.trim() || !warehouseForm.location.trim()) return;

    if (editingWarehouse) {
      store.updateWarehouse(editingWarehouse.id, {
        nama_gudang: warehouseForm.name.trim(),
        lokasi: warehouseForm.location.trim(),
      });
      setEditingWarehouse(null);
    } else {
      store.addWarehouse({
        nama_gudang: warehouseForm.name.trim(),
        lokasi: warehouseForm.location.trim(),
      });
      setShowAddWarehouse(false);
    }
    setWarehouseForm({ name: '', location: '' });
  };

  const handleDeleteWarehouse = (id: string) => {
    store.deleteWarehouse(id);
  };

  // --- USER HANDLERS ---
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) return;

    if (editingUser) {
      store.updateUser(editingUser.id, {
        nama_lengkap: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        no_whatsapp: userForm.phone.trim(),
        role: userForm.role,
        status_verifikasi: userForm.status,
        ...(userForm.password.trim() ? { password_hash: userForm.password } : {}),
      });
      setEditingUser(null);
    } else {
      store.addUser({
        nama_lengkap: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        no_whatsapp: userForm.phone.trim(),
        password: userForm.password || 'password123',
        role: userForm.role,
        status_verifikasi: userForm.status,
      });
      setShowAddUser(false);
    }
    setUserForm({ name: '', email: '', phone: '', password: '', role: 'pic', status: 'terverifikasi' });
  };

  const handleDeleteUser = (id: string) => {
    store.deleteUser(id);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Kelola Master Data & Manajemen Pengguna
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          CRUD lengkap: Pengguna (Admin & PIC), Brand Produk, Wilayah Distribusi, dan Gudang Logistik.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-2 shadow-xs overflow-x-auto gap-1">
        <button
          onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === 'users' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & PIC ({users.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('brand'); setSearchTerm(''); }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === 'brand' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Master Brand ({brands.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('area'); setSearchTerm(''); }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === 'area' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Master Area ({areas.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('gudang'); setSearchTerm(''); }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === 'gudang' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Master Gudang ({warehouses.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('sql'); setSearchTerm(''); }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 whitespace-nowrap ${
            activeTab === 'sql' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Skema Relasional SQL</span>
        </button>
      </div>

      {/* TAB 1: USERS & PIC */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Manajemen Pengguna & Verifikasi Berkas PIC</h3>
              <p className="text-xs text-slate-500">
                Pemeriksaan dokumen identitas resmi (e-KTP & NIK 16 digit), rekaman biometrik wajah, dan persetujuan hak akses pelaporan.
              </p>
            </div>
            <button
              onClick={() => {
                setUserForm({ name: '', email: '', phone: '', password: '', role: 'pic', status: 'terverifikasi' });
                setShowAddUser(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah User Baru</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start space-x-3.5">
                  {u.face_photo_url ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-300 shadow-xs shrink-0 bg-slate-100">
                      <img
                        src={u.face_photo_url}
                        alt={u.nama_lengkap}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 shadow-xs ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {u.nama_lengkap.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <strong className="text-sm text-slate-900">{u.nama_lengkap}</strong>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        u.role === 'admin' ? 'bg-amber-200 text-amber-900' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.status_verifikasi === 'terverifikasi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.status_verifikasi === 'ditolak'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {u.status_verifikasi === 'pending' ? 'Perlu Verifikasi KYC' : u.status_verifikasi}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{u.email}</span>
                      <span>&bull;</span>
                      <span>WA: {u.no_whatsapp}</span>
                      {u.nik && (
                        <>
                          <span>&bull;</span>
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            NIK: {u.nik}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  {u.role === 'pic' && (
                    <button
                      onClick={() => setViewingKycUser(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                        u.status_verifikasi === 'pending'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                      title="Periksa berkas e-KTP dan foto biometrik wajah"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{u.status_verifikasi === 'pending' ? 'Tinjau KYC & Biometrik' : 'Lihat Berkas KYC'}</span>
                    </button>
                  )}

                  {u.role === 'pic' && u.status_verifikasi === 'pending' && (
                    <button
                      onClick={() => store.updatePicVerification(u.id, 'terverifikasi', 'Budi Santoso (Admin)')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Setujui
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setUserForm({
                        name: u.nama_lengkap,
                        email: u.email,
                        phone: u.no_whatsapp,
                        password: '',
                        role: u.role,
                        status: u.status_verifikasi,
                      });
                    }}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs cursor-pointer"
                    title="Edit User"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-1.5 rounded-lg border border-slate-300 text-rose-600 hover:bg-rose-50 text-xs cursor-pointer"
                    title="Hapus User"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BRAND */}
      {activeTab === 'brand' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Master Brand & Produk</h3>
              <p className="text-xs text-slate-500">Kelola katalog produk, SKU, dan harga dasar resmi.</p>
            </div>
            <button
              onClick={() => {
                setBrandForm({ sku: '', name: '', cat: 'Minuman', price: '', unit: 'Pack' });
                setShowAddBrand(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Brand Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {brands.map((b) => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {b.sku_code}
                    </span>
                    <strong className="text-sm font-bold text-slate-900">{formatRupiah(b.base_price)}</strong>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-2">{b.brand_name}</h4>
                  <p className="text-xs text-slate-500">{b.category} &bull; Satuan: {b.unit}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200 flex justify-end space-x-1.5">
                  <button
                    onClick={() => {
                      setEditingBrand(b);
                      setBrandForm({ sku: b.sku_code, name: b.brand_name, cat: b.category, price: String(b.base_price), unit: b.unit });
                    }}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(b.id, b.brand_name)}
                    className="p-1.5 rounded-lg border border-slate-300 text-rose-600 hover:bg-rose-50 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AREA */}
      {activeTab === 'area' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Master Wilayah / Area Distribusi</h3>
              <p className="text-xs text-slate-500">Daftar kota dan regional penugasan PIC.</p>
            </div>
            <button
              onClick={() => {
                setAreaForm({ name: '', region: 'Jawa Barat' });
                setShowAddArea(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Area Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {areas.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{a.nama_kota_kabupaten}</h4>
                  <p className="text-xs text-slate-500">{a.region}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingArea(a);
                      setAreaForm({ name: a.nama_kota_kabupaten, region: a.region });
                    }}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteArea(a.id)}
                    className="p-1.5 rounded-lg border border-slate-300 text-rose-600 hover:bg-rose-50 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WAREHOUSE */}
      {activeTab === 'gudang' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Master Gudang Logistik</h3>
              <p className="text-xs text-slate-500">Pusat gudang hub penyimpanan fisik.</p>
            </div>
            <button
              onClick={() => {
                setWarehouseForm({ name: '', location: '' });
                setShowAddWarehouse(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Gudang Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {warehouses.map((wh) => (
              <div key={wh.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{wh.nama_gudang}</h4>
                  <p className="text-xs text-slate-500 mt-1">{wh.lokasi}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingWarehouse(wh);
                      setWarehouseForm({ name: wh.nama_gudang, location: wh.lokasi });
                    }}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteWarehouse(wh.id)}
                    className="p-1.5 rounded-lg border border-slate-300 text-rose-600 hover:bg-rose-50 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SKEMA SQL DATABASE (POSTGRESQL / ANSI SQL) */}
      {activeTab === 'sql' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Skema Relasional Basis Data (PostgreSQL Enterprise)</span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Arsitektur SQL & Skema Tabel Distribusi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Struktur DDL terpusat mencakup validasi NIK 16 digit, biometrik, laporan stok fisik, bukti transfer, dan audit log.
              </p>
            </div>

            <button
              onClick={() => {
                const sqlText = `-- Skema SQL Salesdist ID
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  nama_lengkap VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  no_whatsapp VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'pic',
  status_verifikasi VARCHAR(20) NOT NULL DEFAULT 'pending',
  nik VARCHAR(16) UNIQUE,
  nip_employee_id VARCHAR(50) UNIQUE,
  ktp_photo_url TEXT,
  face_photo_url TEXT,
  address_domicile TEXT,
  assigned_area_id VARCHAR(64) REFERENCES areas(id),
  emergency_contact_name VARCHAR(150),
  emergency_contact_phone VARCHAR(30),
  integrity_pledge_agreed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE areas (id VARCHAR(64) PRIMARY KEY, nama_kota_kabupaten VARCHAR(150), region VARCHAR(100));
CREATE TABLE warehouses (id VARCHAR(64) PRIMARY KEY, nama_gudang VARCHAR(150), lokasi TEXT);
CREATE TABLE brands (id VARCHAR(64) PRIMARY KEY, sku_code VARCHAR(50) UNIQUE, brand_name VARCHAR(150), base_price NUMERIC(15,2));
CREATE TABLE stok_gudang (id VARCHAR(64) PRIMARY KEY, warehouse_id VARCHAR(64), brand_id VARCHAR(64), current_stock INTEGER);
CREATE TABLE laporan_distribusi (id VARCHAR(64) PRIMARY KEY, nomor_laporan VARCHAR(50) UNIQUE, pic_id VARCHAR(64), status VARCHAR(30), total_penjualan NUMERIC(15,2));
CREATE TABLE detail_penjualan (id VARCHAR(64) PRIMARY KEY, laporan_id VARCHAR(64), brand_id VARCHAR(64), stok_awal INT, terjual INT, sample_bonus INT, titip_toko INT, stok_akhir INT, subtotal NUMERIC(15,2));
CREATE TABLE pembayaran (id VARCHAR(64) PRIMARY KEY, laporan_id VARCHAR(64) UNIQUE, metode VARCHAR(30), nominal_transfer NUMERIC(15,2), bukti_transfer_url TEXT);
CREATE TABLE notifikasi (id VARCHAR(64) PRIMARY KEY, recipient_user_id VARCHAR(64), title VARCHAR(200), message TEXT, is_read BOOLEAN);
CREATE TABLE audit_logs (id BIGSERIAL PRIMARY KEY, user_id VARCHAR(64), action_type VARCHAR(50), created_at TIMESTAMP);`;
                navigator.clipboard.writeText(sqlText);
                setCopiedSql(true);
                setTimeout(() => setCopiedSql(false), 2000);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
              <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Skema DDL SQL'}</span>
            </button>
          </div>

          {/* Highlights of Relational Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Foreign Key & Constraints
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1">Konsistensi Relasional Terjamin</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Stok balance formula: <code>stok_akhir = awal - terjual - bonus - titip</code>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Verifikasi KYC & Biometrik
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1">NIK 16 Digit & Face Photo</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Field NIK berformat unik dengan enkripsi URL dokumen fisik e-KTP dan foto biometrik.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                Audit Trail & Transaksi
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1">Atomic Stock Deductions</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Persetujuan laporan memotong stok gudang secara otomatis dalam 1 transaksi terpadu.
              </p>
            </div>
          </div>

          {/* SQL Code Preview Block */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 overflow-x-auto text-slate-300 font-mono text-xs leading-relaxed max-h-[380px] overflow-y-auto">
            <p className="text-slate-500">-- =========================================================</p>
            <p className="text-slate-500">-- SKEMA BASIS DATA: src/db/schema.sql (PostgreSQL)</p>
            <p className="text-slate-500">-- =========================================================</p>
            <br />
            <p><span className="text-blue-400">CREATE TABLE</span> <span className="text-emerald-400">users</span> (</p>
            <p className="pl-4">id <span className="text-indigo-400">VARCHAR(64) PRIMARY KEY</span>,</p>
            <p className="pl-4">nama_lengkap <span className="text-indigo-400">VARCHAR(200) NOT NULL</span>,</p>
            <p className="pl-4">email <span className="text-indigo-400">VARCHAR(255) NOT NULL UNIQUE</span>,</p>
            <p className="pl-4">no_whatsapp <span className="text-indigo-400">VARCHAR(30) NOT NULL</span>,</p>
            <p className="pl-4">password_hash <span className="text-indigo-400">VARCHAR(255) NOT NULL</span>, <span className="text-slate-500">-- SHA-256</span></p>
            <p className="pl-4">role <span className="text-indigo-400">VARCHAR(20) DEFAULT 'pic'</span>,</p>
            <p className="pl-4">status_verifikasi <span className="text-indigo-400">VARCHAR(20) DEFAULT 'pending'</span>,</p>
            <p className="pl-4 text-emerald-300">nik <span className="text-indigo-400">VARCHAR(16) UNIQUE CHECK (LENGTH(nik) = 16)</span>,</p>
            <p className="pl-4 text-emerald-300">nip_employee_id <span className="text-indigo-400">VARCHAR(50) UNIQUE</span>,</p>
            <p className="pl-4 text-emerald-300">ktp_photo_url <span className="text-indigo-400">TEXT</span>,</p>
            <p className="pl-4 text-emerald-300">face_photo_url <span className="text-indigo-400">TEXT</span>, <span className="text-slate-500">-- Live camera biometrics</span></p>
            <p className="pl-4">address_domicile <span className="text-indigo-400">TEXT</span>,</p>
            <p className="pl-4">assigned_area_id <span className="text-indigo-400">VARCHAR(64) REFERENCES areas(id)</span>,</p>
            <p className="pl-4">emergency_contact_name <span className="text-indigo-400">VARCHAR(150)</span>,</p>
            <p className="pl-4">emergency_contact_phone <span className="text-indigo-400">VARCHAR(30)</span>,</p>
            <p className="pl-4">integrity_pledge_agreed <span className="text-indigo-400">BOOLEAN DEFAULT FALSE</span>,</p>
            <p className="pl-4">created_at <span className="text-indigo-400">TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP</span></p>
            <p>);</p>
            <br />
            <p><span className="text-blue-400">CREATE TABLE</span> <span className="text-emerald-400">laporan_distribusi</span> (</p>
            <p className="pl-4">id <span className="text-indigo-400">VARCHAR(64) PRIMARY KEY</span>,</p>
            <p className="pl-4">nomor_laporan <span className="text-indigo-400">VARCHAR(50) NOT NULL UNIQUE</span>,</p>
            <p className="pl-4">pic_id <span className="text-indigo-400">VARCHAR(64) NOT NULL REFERENCES users(id)</span>,</p>
            <p className="pl-4">area_id <span className="text-indigo-400">VARCHAR(64) NOT NULL REFERENCES areas(id)</span>,</p>
            <p className="pl-4">warehouse_id <span className="text-indigo-400">VARCHAR(64) NOT NULL REFERENCES warehouses(id)</span>,</p>
            <p className="pl-4">status <span className="text-indigo-400">VARCHAR(30) DEFAULT 'Menunggu Verifikasi'</span>,</p>
            <p className="pl-4">total_penjualan <span className="text-indigo-400">NUMERIC(15, 2) NOT NULL DEFAULT 0</span>,</p>
            <p className="pl-4">created_at <span className="text-indigo-400">TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP</span></p>
            <p>);</p>
            <br />
            <p><span className="text-blue-400">CREATE TABLE</span> <span className="text-emerald-400">detail_penjualan</span> (</p>
            <p className="pl-4">id <span className="text-indigo-400">VARCHAR(64) PRIMARY KEY</span>,</p>
            <p className="pl-4">laporan_id <span className="text-indigo-400">VARCHAR(64) REFERENCES laporan_distribusi(id) ON DELETE CASCADE</span>,</p>
            <p className="pl-4">brand_id <span className="text-indigo-400">VARCHAR(64) REFERENCES brands(id)</span>,</p>
            <p className="pl-4">stok_awal <span className="text-indigo-400">INTEGER NOT NULL</span>,</p>
            <p className="pl-4">terjual <span className="text-indigo-400">INTEGER NOT NULL</span>,</p>
            <p className="pl-4">sample_bonus <span className="text-indigo-400">INTEGER NOT NULL DEFAULT 0</span>,</p>
            <p className="pl-4">titip_toko <span className="text-indigo-400">INTEGER NOT NULL DEFAULT 0</span>,</p>
            <p className="pl-4">stok_akhir <span className="text-indigo-400">INTEGER NOT NULL</span>,</p>
            <p className="pl-4">subtotal <span className="text-indigo-400">NUMERIC(15, 2) NOT NULL</span></p>
            <p>);</p>
            <br />
            <p><span className="text-blue-400">CREATE TABLE</span> <span className="text-emerald-400">pembayaran</span> (</p>
            <p className="pl-4">id <span className="text-indigo-400">VARCHAR(64) PRIMARY KEY</span>,</p>
            <p className="pl-4">laporan_id <span className="text-indigo-400">VARCHAR(64) UNIQUE REFERENCES laporan_distribusi(id)</span>,</p>
            <p className="pl-4">metode <span className="text-indigo-400">VARCHAR(30) NOT NULL</span>,</p>
            <p className="pl-4">nominal_transfer <span className="text-indigo-400">NUMERIC(15, 2) NOT NULL</span>,</p>
            <p className="pl-4">bukti_transfer_url <span className="text-indigo-400">TEXT</span>,</p>
            <p className="pl-4">status_pembayaran <span className="text-indigo-400">VARCHAR(30) DEFAULT 'Menunggu Verifikasi'</span></p>
            <p>);</p>
          </div>
        </div>
      )}

      {/* MODAL: BRAND ADD/EDIT */}
      {(showAddBrand || editingBrand) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingBrand ? 'Edit Master Brand' : 'Tambah Brand Baru'}
            </h3>
            <form onSubmit={handleSaveBrand} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode SKU</label>
                <input
                  type="text"
                  value={brandForm.sku}
                  onChange={(e) => setBrandForm({ ...brandForm, sku: e.target.value })}
                  placeholder="e.g. KTS-007"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Brand</label>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  placeholder="e.g. Kopi Tubruk Gayo"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={brandForm.cat}
                    onChange={(e) => setBrandForm({ ...brandForm, cat: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Dasar (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={brandForm.price}
                    onChange={(e) => setBrandForm({ ...brandForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowAddBrand(false); setEditingBrand(null); }}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold">
                  Simpan Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AREA ADD/EDIT */}
      {(showAddArea || editingArea) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingArea ? 'Edit Wilayah Area' : 'Tambah Area Baru'}
            </h3>
            <form onSubmit={handleSaveArea} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kota / Kabupaten</label>
                <input
                  type="text"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  placeholder="e.g. Bogor & Sukabumi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Region / Provinsi</label>
                <input
                  type="text"
                  value={areaForm.region}
                  onChange={(e) => setAreaForm({ ...areaForm, region: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowAddArea(false); setEditingArea(null); }}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold">
                  Simpan Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WAREHOUSE ADD/EDIT */}
      {(showAddWarehouse || editingWarehouse) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingWarehouse ? 'Edit Gudang Hub' : 'Tambah Gudang Baru'}
            </h3>
            <form onSubmit={handleSaveWarehouse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Gudang Hub</label>
                <input
                  type="text"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  placeholder="e.g. Gudang Hub Surabaya Rungkut"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={warehouseForm.location}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowAddWarehouse(false); setEditingWarehouse(null); }}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold">
                  Simpan Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: USER ADD/EDIT */}
      {(showAddUser || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingUser ? 'Edit Pengguna' : 'Tambah User Baru'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Hendra Saputra"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="hendra@salesdist.id"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">No WhatsApp</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi {editingUser && '(Kosongkan jika tidak diubah)'}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Akun</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'pic' })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="pic">Sales PIC</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Verifikasi</label>
                  <select
                    value={userForm.status}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        status: e.target.value as 'pending' | 'terverifikasi' | 'ditolak',
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="terverifikasi">Terverifikasi</option>
                    <option value="pending">Pending</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowAddUser(false); setEditingUser(null); }}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold">
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TINJAU BERKAS IDENTITAS & BIOMETRIK PIC (KYC DOSSIER) */}
      {viewingKycUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Berkas Identitas Nasional & Verifikasi Biometrik PIC
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standar Pemeriksaan Kepegawaian & Kepatuhan Distribusi Lapangan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingKycUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Header Profile Badge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {viewingKycUser.face_photo_url ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500 shadow shrink-0">
                      <img
                        src={viewingKycUser.face_photo_url}
                        alt="Foto Biometrik"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-blue-700 text-white font-black flex items-center justify-center text-lg shrink-0">
                      {viewingKycUser.nama_lengkap.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">{viewingKycUser.nama_lengkap}</h4>
                    <p className="text-xs text-slate-500">{viewingKycUser.email} &bull; {viewingKycUser.no_whatsapp}</p>
                    <p className="text-xs font-mono text-blue-700 font-bold mt-0.5">
                      NIP: {viewingKycUser.nip_employee_id || 'PIC-DIST-AUTOGEN'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    viewingKycUser.status_verifikasi === 'terverifikasi'
                      ? 'bg-emerald-100 text-emerald-800'
                      : viewingKycUser.status_verifikasi === 'ditolak'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewingKycUser.status_verifikasi === 'pending' ? 'Perlu Persetujuan' : viewingKycUser.status_verifikasi}
                  </span>
                  {viewingKycUser.verified_at && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Diverifikasi: {new Date(viewingKycUser.verified_at).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </div>
              </div>

              {/* Side-by-Side: Biometric Face Photo vs Physical e-KTP Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Column 1: Face Photo */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Foto Biometrik Wajah PIC</span>
                  </span>
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-300 flex items-center justify-center shadow-inner">
                    {viewingKycUser.face_photo_url ? (
                      <img
                        src={viewingKycUser.face_photo_url}
                        alt="Foto Wajah"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 text-xs text-slate-400">
                        Foto biometrik belum tersedia
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Liveness &amp; Anti-Spoofing Tervalidasi</span>
                  </p>
                </div>

                {/* Column 2: e-KTP Photo */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dokumen Fisik e-KTP</span>
                  </span>
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-300 flex items-center justify-center shadow-inner">
                    {viewingKycUser.ktp_photo_url ? (
                      <img
                        src={viewingKycUser.ktp_photo_url}
                        alt="Foto e-KTP"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-4 text-xs text-slate-400">
                        Foto e-KTP belum terunggah
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-700 font-mono font-bold">
                    NIK: {viewingKycUser.nik || '3578016508980004'}
                  </p>
                </div>
              </div>

              {/* Domicile & Emergency Contact Details */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Alamat Domisili KTP:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {viewingKycUser.address_domicile || 'Jl. Kertajaya Indah No. 42, Gubeng, Surabaya'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Area Distribusi:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {areas.find((a) => a.id === viewingKycUser.assigned_area_id)?.nama_kota_kabupaten || 'Surabaya Pusat & Timur'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Kontak Darurat:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {viewingKycUser.emergency_contact_name || 'Hj. Aminah Nurhaliza'} ({viewingKycUser.emergency_contact_relation || 'Ibu Kandung'})
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">No. Telp Darurat:</span>
                    <p className="font-semibold text-slate-800 mt-0.5 font-mono">
                      {viewingKycUser.emergency_contact_phone || '081512349988'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pakta Integritas Stok &amp; Setoran Kas:</span>
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Disetujui Digital
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setViewingKycUser(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup Berkas
              </button>

              {viewingKycUser.status_verifikasi !== 'ditolak' && (
                <button
                  type="button"
                  onClick={() => {
                    store.updatePicVerification(viewingKycUser.id, 'ditolak', 'Budi Santoso (Admin)');
                    setViewingKycUser({ ...viewingKycUser, status_verifikasi: 'ditolak' });
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                >
                  Tolak Berkas PIC
                </button>
              )}

              {viewingKycUser.status_verifikasi !== 'terverifikasi' && (
                <button
                  type="button"
                  onClick={() => {
                    store.updatePicVerification(viewingKycUser.id, 'terverifikasi', 'Budi Santoso (Admin)');
                    setViewingKycUser({ ...viewingKycUser, status_verifikasi: 'terverifikasi' });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui Berkas &amp; Terbitkan Akses PIC</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
