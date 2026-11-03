import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Search,
  Warehouse,
  Boxes,
  Clock,
  ShieldCheck,
  UserCheck,
  FileCheck2,
  ArrowLeft,
  MapPin,
  Camera,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { store } from '../../db/store';
import { User as UserType } from '../../types';
import { FaceBiometricCapture } from './FaceBiometricCapture';
import { IdentityDocumentUpload } from './IdentityDocumentUpload';
import { SAMPLE_KTP_PHOTO, SAMPLE_FACE_PHOTO_SITI } from '../../data/seedData';

interface AuthDashboardProps {
  onLoginSuccess: (user: UserType) => void;
}

export const AuthDashboard: React.FC<AuthDashboardProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'check_status'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingAccountPrompt, setPendingAccountPrompt] = useState<string | null>(null);

  // Multi-step Register form state
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [regNama, setRegNama] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAreaId, setRegAreaId] = useState('area-1');

  // KYC Fields
  const [regNik, setRegNik] = useState('');
  const [regNip, setRegNip] = useState('');
  const [regKtpPhoto, setRegKtpPhoto] = useState<string>('');
  const [regAddress, setRegAddress] = useState('');
  const [regEmergencyName, setRegEmergencyName] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regEmergencyRelation, setRegEmergencyRelation] = useState('Orang Tua');
  
  // Biometric Field
  const [regFacePhoto, setRegFacePhoto] = useState<string>('');

  // Integrity Pledge
  const [pledgeStock, setPledgeStock] = useState(false);
  const [pledgeCash, setPledgeCash] = useState(false);
  const [pledgeIdentity, setPledgeIdentity] = useState(false);

  const [regSuccessUser, setRegSuccessUser] = useState<UserType | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // Status Checker state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserType | null | undefined>(undefined);

  const dbState = store.getState();
  const areas = dbState.areas;
  const totalWarehouses = dbState.warehouses.length;
  const totalBrands = dbState.brands.length;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setPendingAccountPrompt(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Harap isi alamat email resmi / username dan kata sandi.');
      return;
    }

    const res = store.login(loginEmail, loginPassword);
    if (res.error) {
      setLoginError(res.error);
      if (res.error.toLowerCase().includes('menunggu verifikasi')) {
        setPendingAccountPrompt(loginEmail.trim());
      }
    } else if (res.user) {
      onLoginSuccess(res.user);
    }
  };

  // Step 1 Validation -> Next to Step 2
  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regNama.trim()) {
      setRegError('Nama Lengkap (sesuai e-KTP) wajib diisi.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@') || !regEmail.includes('.')) {
      setRegError('Alamat email tidak valid. Gunakan format korporat atau email resmi.');
      return;
    }
    if (!regWhatsapp.trim() || regWhatsapp.length < 10) {
      setRegError('Nomor WhatsApp aktif minimal 10 digit angka.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Kata sandi minimal 6 karakter demi kepatuhan keamanan data.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    setRegStep(2);
  };

  // Step 2 Validation -> Next to Step 3
  const handleNextToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regNik.length !== 16) {
      setRegError('Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka.');
      return;
    }
    if (!regKtpPhoto) {
      setRegError('Foto fisik e-KTP asli wajib diunggah atau gunakan sampel demo.');
      return;
    }
    if (!regAddress.trim()) {
      setRegError('Alamat domisili sesuai e-KTP wajib diisi.');
      return;
    }

    setRegStep(3);
  };

  // Step 3 Validation -> Next to Step 4
  const handleNextToStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regFacePhoto) {
      setRegError('Foto verifikasi biometrik wajah wajib diambil melalui kamera atau diunggah.');
      return;
    }

    setRegStep(4);
  };

  // Final Registration Submission
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!pledgeStock || !pledgeCash || !pledgeIdentity) {
      setRegError('Anda wajib menyetujui seluruh klausul Pakta Integritas & Kepatuhan Lapangan.');
      return;
    }

    const res = store.registerPic({
      nama_lengkap: regNama,
      email: regEmail,
      no_whatsapp: regWhatsapp,
      password: regPassword,
      nik: regNik,
      nip_employee_id: regNip,
      ktp_photo_url: regKtpPhoto,
      face_photo_url: regFacePhoto,
      address_domicile: regAddress,
      assigned_area_id: regAreaId,
      emergency_contact_name: regEmergencyName,
      emergency_contact_phone: regEmergencyPhone,
      emergency_contact_relation: regEmergencyRelation,
      integrity_pledge_agreed: true,
    });

    if (!res.success) {
      setRegError(res.error || 'Pendaftaran PIC gagal.');
    } else if (res.user) {
      setRegSuccessUser(res.user);
    }
  };

  const handleFillDemoKyc = () => {
    setRegNama('Wahyu Hidayat, S.Kom');
    setRegEmail(`wahyu.pic${Math.floor(Math.random() * 900 + 100)}@salesdist.id`);
    setRegWhatsapp('081399228833');
    setRegPassword('password123');
    setRegConfirmPassword('password123');
    setRegNik(`327301${Math.floor(1000000000 + Math.random() * 9000000000)}`.slice(0, 16));
    setRegNip(`PIC-DIST-2026-${Math.floor(100 + Math.random() * 900)}`);
    setRegKtpPhoto(SAMPLE_KTP_PHOTO);
    setRegFacePhoto(SAMPLE_FACE_PHOTO_SITI);
    setRegAddress('Jl. Buah Batu No. 108, Lengkong, Kota Bandung');
    setRegEmergencyName('Ratna Sari Dewi');
    setRegEmergencyPhone('081288334455');
    setRegEmergencyRelation('Pasangan');
    setPledgeStock(true);
    setPledgeCash(true);
    setPledgeIdentity(true);
    setRegError(null);
  };

  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchedUser(undefined);
      return;
    }
    const found = dbState.users.find(
      (u) =>
        u.email.toLowerCase() === query ||
        u.no_whatsapp.toLowerCase() === query ||
        (u.nik && u.nik.toLowerCase() === query) ||
        (u.nip_employee_id && u.nip_employee_id.toLowerCase() === query) ||
        u.nama_lengkap.toLowerCase().includes(query)
    );
    setSearchedUser(found || null);
  };

  const quickLogin = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginError(null);
    setPendingAccountPrompt(null);
    setActiveTab('login');

    const res = store.login(email, pass);
    if (res.error) {
      setLoginError(res.error);
      if (res.error.toLowerCase().includes('menunggu verifikasi')) {
        setPendingAccountPrompt(email);
      }
    } else if (res.user) {
      onLoginSuccess(res.user);
    }
  };

  const loginAsAdminToApprove = () => {
    const adminUser = dbState.users.find((u) => u.role === 'admin') || dbState.users[0];
    if (adminUser) {
      onLoginSuccess(adminUser);
    }
  };

  const resetRegisterWizard = () => {
    setRegStep(1);
    setRegNama('');
    setRegEmail('');
    setRegWhatsapp('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegNik('');
    setRegNip('');
    setRegKtpPhoto('');
    setRegFacePhoto('');
    setRegAddress('');
    setRegEmergencyName('');
    setRegEmergencyPhone('');
    setPledgeStock(false);
    setPledgeCash(false);
    setPledgeIdentity(false);
    setRegSuccessUser(null);
    setRegError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Bar Header: Strict Corporate Identity */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-700 flex items-center justify-center font-bold text-white shadow-md shadow-blue-900/50 ring-1 ring-white/10">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-tight text-white font-sans">
                SALES<span className="text-blue-500">DIST</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                PORTAL RESMI B2B
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              PT Salesdist Distribusi Indonesia &bull; Sistem Pengendalian Distribusi & Keuangan
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enkripsi TLS 1.3 & SHA-256</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gateway Online</span>
          </span>
        </div>
      </header>

      {/* Main Container: Wide Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Corporate Brand Showcase & SOP Compliance Guidelines (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold tracking-wide">
                <BadgeCheck className="w-4 h-4 text-blue-400" />
                <span>Standard Operating Procedure (SOP) Distribusi Logistik</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Portal Terpadu Tenaga Pemasaran & Verifikasi Keuangan Lapangan
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Infrastruktur digital korporat untuk pencatatan distribusi barang konsinyasi, verifikasi fisik mutasi kas perbankan, dan validasi biometrik identitas Sales Person in Charge (PIC).
              </p>
            </div>

            {/* Live Operational Metrics Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
                <div className="flex items-center space-x-2 text-blue-400 mb-1">
                  <Warehouse className="w-4 h-4" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Pusat Pergudangan
                  </span>
                </div>
                <p className="text-2xl font-black text-white">{totalWarehouses} Hub</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Cakung & Hub Priangan</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
                <div className="flex items-center space-x-2 text-indigo-400 mb-1">
                  <Boxes className="w-4 h-4" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Principal Terdaftar
                  </span>
                </div>
                <p className="text-2xl font-black text-white">{totalBrands} SKU Brand</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Kopi, Teh, Snack & Mineral</p>
              </div>
            </div>

            {/* Corporate KYC & Biometric Verification Protocol Infographic */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Protokol Verifikasi Identitas PIC (KYC)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">STANDAR ISO-27001</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-white">Pemeriksaan Identitas Nasional (e-KTP & NIK):</strong>
                    <p className="text-slate-400 text-[11px]">Validasi 16 digit NIK dan pencocokan data kependudukan resmi.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-white">Perekaman Biometrik Wajah (Live Face Match):</strong>
                    <p className="text-slate-400 text-[11px]">Pengambilan foto wajah langsung dengan panduan oval biometrik anti-spoofing.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-white">Audit Kelayakan & Persetujuan Administrator:</strong>
                    <p className="text-slate-400 text-[11px]">Administrator meninjau fisik berkas sebelum hak akses pelaporan diterbitkan.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Security Seal */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2.5">
              <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Seluruh aktivitas penyerahan barang dan penerimaan pembayaran diaudit secara terpusat dengan integritas basis data transaksional.
              </span>
            </div>
          </div>

          {/* Right Column: Portal Auth Card (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1">
              
              {/* Tab Navigation Header: Formal Corporate Look */}
              <div className="flex border-b border-slate-800 bg-slate-950/80 p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError(null);
                    setPendingAccountPrompt(null);
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl text-center text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 ${
                    activeTab === 'login'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Autentikasi Masuk</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRegError(null);
                    setRegSuccessUser(null);
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl text-center text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 ${
                    activeTab === 'register'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Registrasi PIC & KYC</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('check_status');
                    setSearchedUser(undefined);
                  }}
                  className={`flex-1 py-3 px-2 sm:px-3 rounded-xl text-center text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 ${
                    activeTab === 'check_status'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Status Verifikasi</span>
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between">
                
                {/* ================= TAB 1: LOGIN ================= */}
                {activeTab === 'login' && (
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sistem Keamanan Terpadu</span>
                      </div>
                      <h2 className="text-xl font-extrabold text-white">Autentikasi Akun Resmi</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Masukkan alamat email resmi dan kata sandi korporat Anda untuk mengakses dashboard operasional.
                      </p>
                    </div>

                    {loginError && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold">{loginError}</p>
                          {pendingAccountPrompt && (
                            <div className="mt-2.5 pt-2.5 border-t border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-[11px] text-rose-200">
                                Akun terdaftar namun masih menunggu verifikasi dokumen identitas & biometrik.
                              </span>
                              <button
                                type="button"
                                onClick={loginAsAdminToApprove}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition whitespace-nowrap"
                              >
                                Masuk Sebagai Admin Budi &rarr;
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                      {/* Hint Banner */}
                      <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-xs text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">Kredensial Pengujian:</span>
                          <span className="text-[11px] text-blue-300">
                            Admin: <strong className="text-white font-mono">admin@salesdist.id</strong> (sandi: <code className="text-amber-300">admin123</code>)
                          </span>
                          <br className="sm:hidden" />
                          <span className="text-[11px] text-blue-300 sm:ml-2">
                            PIC: <strong className="text-white font-mono">fauzi@salesdist.id</strong> (sandi: <code className="text-blue-300">password123</code>)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail('admin@salesdist.id');
                            setLoginPassword('admin123');
                            setLoginError(null);
                          }}
                          className="px-2.5 py-1 rounded bg-blue-600/50 hover:bg-blue-600 text-white font-bold text-[10px] whitespace-nowrap self-start sm:self-auto transition cursor-pointer"
                        >
                          Isi Otomatis Admin
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Alamat Email / Username (atau ketik &apos;admin&apos; / &apos;fauzi&apos;)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="admin@salesdist.id atau fauzi@salesdist.id (atau cukup ketik: admin)"
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Kata Sandi Akun
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="admin123 untuk Admin / password123 untuk PIC"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Masuk ke Portal Operasional</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Quick Demo Access Grid */}
                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          <span>Pintas Akses Evaluasi (1-Klik Masuk):</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Admin */}
                        <button
                          type="button"
                          onClick={() => quickLogin('admin@salesdist.id', 'admin123')}
                          className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 uppercase tracking-wider">
                              ADMIN UTAMA
                            </span>
                            <span className="text-[10px] text-amber-300/80 font-mono">admin123</span>
                          </div>
                          <p className="text-xs font-bold text-white mt-1 group-hover:text-amber-300 transition">
                            Budi Santoso
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">admin@salesdist.id</p>
                        </button>

                        {/* PIC Bandung */}
                        <button
                          type="button"
                          onClick={() => quickLogin('fauzi@salesdist.id', 'password123')}
                          className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider">
                              PIC TERVERIFIKASI
                            </span>
                            <span className="text-[10px] text-blue-300/80 font-mono">password123</span>
                          </div>
                          <p className="text-xs font-bold text-white mt-1 group-hover:text-blue-300 transition">
                            Ahmad Fauzi (Bandung)
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">fauzi@salesdist.id</p>
                        </button>

                        {/* PIC Jakarta */}
                        <button
                          type="button"
                          onClick={() => quickLogin('rian@salesdist.id', 'password123')}
                          className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider">
                              PIC TERVERIFIKASI
                            </span>
                            <span className="text-[10px] text-blue-300/80 font-mono">password123</span>
                          </div>
                          <p className="text-xs font-bold text-white mt-1 group-hover:text-blue-300 transition">
                            Rian Pratama (Jakarta)
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">rian@salesdist.id</p>
                        </button>

                        {/* PIC Pending Siti */}
                        <button
                          type="button"
                          onClick={() => quickLogin('siti@salesdist.id', 'password123')}
                          className="p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-left transition group cursor-pointer"
                          title="Uji coba login akun yang belum diverifikasi admin"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-700 text-amber-300 uppercase tracking-wider">
                              STATUS PENDING
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">password123</span>
                          </div>
                          <p className="text-xs font-bold text-slate-200 mt-1">
                            Siti Nurhaliza (Surabaya)
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">siti@salesdist.id</p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= TAB 2: REGISTER PIC (FORMAL KYC & BIOMETRICS) ================= */}
                {activeTab === 'register' && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-white">
                          Pendaftaran Resmi & Verifikasi Biometrik PIC
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Standar resmi pendaftaran tenaga distribusi lapangan dengan verifikasi e-KTP dan biometrik wajah.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleFillDemoKyc}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold flex items-center space-x-1 transition cursor-pointer"
                        title="Isi otomatis seluruh data contoh untuk mempercepat uji coba"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Isi Form Demo Cepat</span>
                      </button>
                    </div>

                    {/* Step Progress Stepper Indicator */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <div
                        className={`h-1.5 rounded-full transition-colors ${
                          regStep >= 1 ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      />
                      <div
                        className={`h-1.5 rounded-full transition-colors ${
                          regStep >= 2 ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      />
                      <div
                        className={`h-1.5 rounded-full transition-colors ${
                          regStep >= 3 ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      />
                      <div
                        className={`h-1.5 rounded-full transition-colors ${
                          regStep >= 4 ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                      <span className={regStep === 1 ? 'text-blue-400' : ''}>1. Akun & Area</span>
                      <span className={regStep === 2 ? 'text-blue-400' : ''}>2. e-KTP & NIK</span>
                      <span className={regStep === 3 ? 'text-blue-400' : ''}>3. Biometrik Wajah</span>
                      <span className={regStep === 4 ? 'text-blue-400' : ''}>4. Pakta Integritas</span>
                    </div>

                    {regError && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        <span className="font-semibold">{regError}</span>
                      </div>
                    )}

                    {/* SUCCESS STATE */}
                    {regSuccessUser ? (
                      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-4">
                        <div className="flex items-start space-x-3.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-white">
                              Berkas Pendaftaran PIC & KYC Berhasil Diterima
                            </h3>
                            <p className="text-xs text-slate-300 mt-1">
                              Data atas nama <strong>{regSuccessUser.nama_lengkap}</strong> (NIK: {regSuccessUser.nik}) telah masuk ke basis data dengan status <strong>Menunggu Verifikasi Administrator</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                          <p className="font-bold text-emerald-400 flex items-center space-x-1.5">
                            <Clock className="w-4 h-4" />
                            <span>Menunggu Pemeriksaan Fisik & Dokumen oleh Administrator</span>
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Foto e-KTP dan foto biometrik wajah Anda telah tersimpan dengan enkripsi aman. Administrator Budi Santoso dapat memeriksa berkas di menu Verifikasi PIC & Master Data.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={loginAsAdminToApprove}
                            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <span>Masuk Sebagai Admin untuk Menyetujui Berkas Ini</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={resetRegisterWizard}
                            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            Daftar PIC Lain
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* STEP 1: KREDENSIAL & AFILIASI */}
                        {regStep === 1 && (
                          <form onSubmit={handleNextToStep2} className="space-y-3.5">
                            <div>
                              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                                Nama Lengkap Resmi (Sesuai e-KTP) <span className="text-rose-400">*</span>
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  value={regNama}
                                  onChange={(e) => setRegNama(e.target.value)}
                                  placeholder="Contoh: Wahyu Hidayat"
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                                  Alamat Email Resmi <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                  <input
                                    type="email"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    placeholder="wahyu@salesdist.id"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                                  No. WhatsApp Aktif PIC <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                  <input
                                    type="tel"
                                    value={regWhatsapp}
                                    onChange={(e) => setRegWhatsapp(e.target.value)}
                                    placeholder="081234567890"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                                Wilayah Distribusi Penugasan <span className="text-rose-400">*</span>
                              </label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <select
                                  value={regAreaId}
                                  onChange={(e) => setRegAreaId(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                  {areas.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.nama_kota_kabupaten} ({a.region})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                                  Kata Sandi Akun (Min 6 Karakter) <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                  <input
                                    type={showRegPassword ? 'text' : 'password'}
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowRegPassword(!showRegPassword)}
                                    className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-200"
                                  >
                                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                                  Konfirmasi Kata Sandi <span className="text-rose-400">*</span>
                                </label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                  <input
                                    type={showRegPassword ? 'text' : 'password'}
                                    value={regConfirmPassword}
                                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition flex items-center justify-center space-x-2 cursor-pointer pt-2"
                            >
                              <span>Lanjut ke Verifikasi e-KTP & NIK</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </form>
                        )}

                        {/* STEP 2: DOKUMEN IDENTITAS & e-KTP */}
                        {regStep === 2 && (
                          <form onSubmit={handleNextToStep3} className="space-y-4">
                            <IdentityDocumentUpload
                              nik={regNik}
                              onNikChange={setRegNik}
                              nip={regNip}
                              onNipChange={setRegNip}
                              ktpPhotoUrl={regKtpPhoto}
                              onKtpPhotoChange={setRegKtpPhoto}
                              address={regAddress}
                              onAddressChange={setRegAddress}
                              emergencyName={regEmergencyName}
                              onEmergencyNameChange={setRegEmergencyName}
                              emergencyPhone={regEmergencyPhone}
                              onEmergencyPhoneChange={setRegEmergencyPhone}
                              emergencyRelation={regEmergencyRelation}
                              onEmergencyRelationChange={setRegEmergencyRelation}
                            />

                            <div className="flex items-center space-x-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setRegStep(1)}
                                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Kembali</span>
                              </button>

                              <button
                                type="submit"
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
                              >
                                <span>Lanjut ke Verifikasi Biometrik Wajah</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </form>
                        )}

                        {/* STEP 3: VERIFIKASI BIOMETRIK WAJAH */}
                        {regStep === 3 && (
                          <form onSubmit={handleNextToStep4} className="space-y-4">
                            <FaceBiometricCapture
                              value={regFacePhoto}
                              onChange={setRegFacePhoto}
                            />

                            <div className="flex items-center space-x-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setRegStep(2)}
                                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Kembali</span>
                              </button>

                              <button
                                type="submit"
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
                              >
                                <span>Lanjut ke Pakta Integritas</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </form>
                        )}

                        {/* STEP 4: PAKTA INTEGRITAS & SUBMIT */}
                        {regStep === 4 && (
                          <form onSubmit={handleFinalSubmit} className="space-y-4">
                            <div>
                              <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span>Pakta Integritas & Kepatuhan Distribusi Lapangan</span>
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">
                                Harap baca dan centang seluruh pernyataan tanggung jawab hukum operasional di bawah ini:
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
                              <label className="flex items-start space-x-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={pledgeStock}
                                  onChange={(e) => setPledgeStock(e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                                />
                                <span className="text-slate-300 group-hover:text-white leading-relaxed">
                                  <strong>Keabsahan Stok Fisik:</strong> Saya berkomitmen menjaga keabsahan fisik seluruh barang sampel, stok awal, barang terjual, dan sisa barang konsinyasi di toko retail.
                                </span>
                              </label>

                              <label className="flex items-start space-x-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={pledgeCash}
                                  onChange={(e) => setPledgeCash(e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                                />
                                <span className="text-slate-300 group-hover:text-white leading-relaxed">
                                  <strong>Tanggung Jawab Kas & Setoran:</strong> Saya bertanggung jawab penuh menyetorkan seluruh uang tunai, bukti transfer bank, atau pembayaran QRIS ke rekening resmi perusahaan tanpa pengurangan.
                                </span>
                              </label>

                              <label className="flex items-start space-x-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={pledgeIdentity}
                                  onChange={(e) => setPledgeIdentity(e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
                                />
                                <span className="text-slate-300 group-hover:text-white leading-relaxed">
                                  <strong>Kebenaran Data e-KTP & Biometrik:</strong> Saya menyatakan bahwa berkas e-KTP (NIK: {regNik || '---'}) dan foto biometrik wajah yang diserahkan adalah benar milik saya pribadi untuk tujuan verifikasi legal.
                                </span>
                              </label>
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setRegStep(3)}
                                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Kembali</span>
                              </button>

                              <button
                                type="submit"
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/40 transition flex items-center justify-center space-x-2 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Kirim Permohonan Registrasi PIC</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ================= TAB 3: CEK STATUS PIC ================= */}
                {activeTab === 'check_status' && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-white">Status Verifikasi Berkas PIC</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Ketik 16 digit NIK e-KTP, email kantor, nomor WhatsApp, atau NIP untuk memeriksa status validasi identitas & biometrik Anda.
                      </p>
                    </div>

                    <form onSubmit={handleCheckStatus} className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Ketik NIK 16 digit (misal: 3578016508980004) atau email/WA..."
                          className="w-full pl-10 pr-28 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                          type="submit"
                          className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Cari Status
                        </button>
                      </div>
                    </form>

                    {searchedUser === null && (
                      <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 text-center text-xs text-slate-300 space-y-1.5">
                        <p className="font-bold text-slate-200">Data PIC Tidak Ditemukan</p>
                        <p className="text-slate-400">
                          Tidak ditemukan data pendaftaran dengan kata kunci &ldquo;{searchQuery}&rdquo;. Silakan melakukan registrasi resmi terlebih dahulu.
                        </p>
                      </div>
                    )}

                    {searchedUser && (
                      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center space-x-3.5">
                            {searchedUser.face_photo_url ? (
                              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-700 shrink-0">
                                <img
                                  src={searchedUser.face_photo_url}
                                  alt="Foto Biometrik"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-sm shrink-0">
                                {searchedUser.nama_lengkap.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-white">{searchedUser.nama_lengkap}</p>
                              <p className="text-xs text-slate-400 font-mono">{searchedUser.email}</p>
                            </div>
                          </div>

                          <div>
                            {searchedUser.status_verifikasi === 'terverifikasi' && (
                              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                TERVERIFIKASI RESMI
                              </span>
                            )}
                            {searchedUser.status_verifikasi === 'pending' && (
                              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                MENUNGGU PERSETUJUAN
                              </span>
                            )}
                            {searchedUser.status_verifikasi === 'ditolak' && (
                              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                DITOLAK
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">NIK KTP:</span>
                            <span className="font-mono font-bold text-white">{searchedUser.nik || 'Terverifikasi'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">NIP Pegawai:</span>
                            <span className="font-mono text-white">{searchedUser.nip_employee_id || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">No. WhatsApp:</span>
                            <span className="text-white font-semibold">{searchedUser.no_whatsapp}</span>
                          </div>
                        </div>

                        {searchedUser.status_verifikasi === 'terverifikasi' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('login');
                              setLoginEmail(searchedUser.email);
                            }}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                          >
                            Akun Aktif &bull; Masuk Sekarang
                          </button>
                        )}

                        {searchedUser.status_verifikasi === 'pending' && (
                          <div className="space-y-2">
                            <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                              Berkas identitas & biometrik sedang dalam antrean verifikasi Admin Budi Santoso.
                            </p>
                            <button
                              type="button"
                              onClick={loginAsAdminToApprove}
                              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                            >
                              Masuk Sebagai Admin untuk Menyetujui Akun Ini &rarr;
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Formal Corporate Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            <strong>PT SALESDIST DISTRIBUSI INDONESIA</strong> &bull; Portal Distribusi & Akuntansi Penjualan
          </p>
          <p className="text-[11px] text-slate-400">
            Kepatuhan Regulasi Distribusi &bull; Enkripsi SHA-256 Terpadu &bull; Dukungan Audit Lapangan
          </p>
        </div>
      </footer>
    </div>
  );
};
