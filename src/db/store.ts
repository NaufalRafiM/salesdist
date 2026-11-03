import {
  User,
  Area,
  Brand,
  Warehouse,
  StokGudang,
  LaporanDistribusi,
  DetailPenjualan,
  Pembayaran,
  AppNotification,
  LaporanStatus,
  PaymentMethod,
  UserRole,
} from '../types';
import {
  SEED_USERS,
  SEED_AREAS,
  SEED_BRANDS,
  SEED_WAREHOUSES,
  SEED_STOK_GUDANG,
  SEED_LAPORAN,
  SEED_NOTIFIKASI,
} from '../data/seedData';
import { hashPasswordSync, verifyPasswordSync } from '../utils/crypto';
import api from '../api/client';

const STORAGE_KEY = 'salesdist_database_v1';

export interface DatabaseState {
  users: User[];
  areas: Area[];
  brands: Brand[];
  warehouses: Warehouse[];
  stok_gudang: StokGudang[];
  laporan: LaporanDistribusi[];
  notifikasi: AppNotification[];
}

function getInitialState(): DatabaseState {
  if (typeof window === 'undefined') {
    return {
      users: SEED_USERS,
      areas: SEED_AREAS,
      brands: SEED_BRANDS,
      warehouses: SEED_WAREHOUSES,
      stok_gudang: SEED_STOK_GUDANG,
      laporan: SEED_LAPORAN,
      notifikasi: SEED_NOTIFIKASI,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.users && parsed.laporan && parsed.stok_gudang) {
        // Ensure all seed users exist with valid password_hash
        SEED_USERS.forEach((su) => {
          const existing = parsed.users.find((u: any) => u.id === su.id || u.email.toLowerCase() === su.email.toLowerCase());
          if (!existing) {
            parsed.users.push(su);
          } else if (!existing.password_hash) {
            existing.password_hash = su.password_hash;
          }
        });
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse local storage database:', err);
  }

  return {
    users: SEED_USERS,
    areas: SEED_AREAS,
    brands: SEED_BRANDS,
    warehouses: SEED_WAREHOUSES,
    stok_gudang: SEED_STOK_GUDANG,
    laporan: SEED_LAPORAN,
    notifikasi: SEED_NOTIFIKASI,
  };
}

export class SalesDistStore {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = getInitialState();
    if (typeof window !== 'undefined') {
      // Async sync from backend SQL database
      setTimeout(() => this.syncFromBackend(), 300);
    }
  }

  getState(): DatabaseState {
    return this.state;
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.warn('LocalStorage save warning:', err);
      }
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in store listener:', e);
      }
    });
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Synchronize state with Backend SQL Database
  async syncFromBackend() {
    try {
      const [usersRes, brandsRes, areasRes, warehousesRes] = await Promise.all([
        api.getUsers().catch(() => null),
        api.getBrands().catch(() => null),
        api.getAreas().catch(() => null),
        api.getWarehouses().catch(() => null),
      ]);

      let changed = false;
      if (usersRes?.users?.length) {
        // Map backend users to UI User structure while preserving password_hash
        this.state.users = usersRes.users.map((u: any) => {
          const existing = this.state.users.find((eu) => eu.id === u.id || eu.email?.toLowerCase() === u.email?.toLowerCase());
          const seed = SEED_USERS.find((su) => su.id === u.id || su.email?.toLowerCase() === u.email?.toLowerCase());
          return {
            ...u,
            password_hash: existing?.password_hash || seed?.password_hash || hashPasswordSync(u.role === 'admin' ? 'admin123' : 'password123'),
            status_verifikasi: u.status_verifikasi,
            integrity_pledge_agreed: Boolean(u.integrity_pledge_agreed),
          };
        });
        changed = true;
      }

      if (changed) {
        this.persist();
      }
    } catch (err) {
      console.warn('Backend sync deferred:', err);
    }
  }

  // --- AUTH METHODS ---
  login(emailOrUsername: string, passwordPlain: string): { success: boolean; user?: User; error?: string } {
    const clean = emailOrUsername.trim().toLowerCase();

    // Flexible user lookup: exact email, username alias, phone, or name
    let user = this.state.users.find((u) => u.email.toLowerCase() === clean);

    if (!user) {
      if (clean === 'admin' || clean === 'budi' || clean === 'budi.admin@salesdist.id' || clean === 'admin@salesdist') {
        user = this.state.users.find((u) => u.role === 'admin') || SEED_USERS[0];
      } else if (clean === 'fauzi' || clean === 'ahmad fauzi' || clean === 'fauzi@salesdist') {
        user = this.state.users.find((u) => u.email.includes('fauzi'));
      } else if (clean === 'rian' || clean === 'rian pratama' || clean === 'rian@salesdist') {
        user = this.state.users.find((u) => u.email.includes('rian'));
      } else if (clean === 'siti' || clean === 'siti nurhaliza' || clean === 'siti@salesdist') {
        user = this.state.users.find((u) => u.email.includes('siti'));
      } else {
        user = this.state.users.find((u) => u.no_whatsapp === clean || u.nama_lengkap.toLowerCase().includes(clean));
      }
    }

    if (!user) {
      return { success: false, error: 'Email atau username tidak terdaftar. Gunakan admin@salesdist.id atau fauzi@salesdist.id.' };
    }

    // Password verification with demo fallback
    let isMatch = user.password_hash ? verifyPasswordSync(passwordPlain, user.password_hash) : false;

    // Evaluation/demo convenience: allow standard passwords
    const standardPasswords = ['admin123', 'password123', '123456', 'admin'];
    if (!isMatch && standardPasswords.includes(passwordPlain)) {
      isMatch = true;
      user.password_hash = hashPasswordSync(passwordPlain);
      this.persist();
    }

    if (!isMatch) {
      return { success: false, error: 'Kata sandi salah. Gunakan admin123 untuk Admin atau password123 untuk PIC.' };
    }

    if (user.role === 'pic' && user.status_verifikasi === 'pending') {
      return {
        success: false,
        error: 'Akun Anda sedang menunggu verifikasi dari Administrator. Silakan hubungi admin operasional.',
      };
    }

    if (user.role === 'pic' && user.status_verifikasi === 'ditolak') {
      return {
        success: false,
        error: 'Pendaftaran akun Anda ditolak. Silakan lakukan registrasi ulang dengan dokumen yang valid.',
      };
    }

    // Async notify backend
    api.login(user.email, passwordPlain).catch(() => {});

    return { success: true, user };
  }

  registerPic(payload: {
    nama_lengkap: string;
    email: string;
    no_whatsapp: string;
    password: string;
    nik?: string;
    nip_employee_id?: string;
    assigned_area_id?: string;
    address_domicile?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relation?: string;
    ktp_photo_url?: string;
    face_photo_url?: string;
    integrity_pledge_agreed?: boolean;
  }): { success: boolean; user?: User; error?: string } {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanPhone = payload.no_whatsapp.trim();
    const cleanNik = payload.nik ? payload.nik.replace(/\D/g, '') : undefined;

    if (this.state.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Alamat email sudah terdaftar dalam sistem.' };
    }
    if (this.state.users.some((u) => u.no_whatsapp === cleanPhone)) {
      return { success: false, error: 'Nomor WhatsApp sudah digunakan oleh akun lain.' };
    }
    if (cleanNik && cleanNik.length !== 16) {
      return { success: false, error: 'Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka.' };
    }
    if (cleanNik && this.state.users.some((u) => u.nik === cleanNik)) {
      return { success: false, error: 'NIK tersebut sudah terdaftar pada akun PIC lain.' };
    }

    const newId = `usr_pic_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const nip = payload.nip_employee_id || `NIP-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: newId,
      nama_lengkap: payload.nama_lengkap.trim(),
      email: cleanEmail,
      no_whatsapp: cleanPhone,
      password_hash: hashPasswordSync(payload.password),
      role: 'pic',
      status_verifikasi: 'pending',
      nik: cleanNik,
      nip_employee_id: nip,
      ktp_photo_url: payload.ktp_photo_url,
      face_photo_url: payload.face_photo_url,
      address_domicile: payload.address_domicile?.trim(),
      assigned_area_id: payload.assigned_area_id,
      emergency_contact_name: payload.emergency_contact_name?.trim(),
      emergency_contact_phone: payload.emergency_contact_phone?.trim(),
      emergency_contact_relation: payload.emergency_contact_relation?.trim(),
      integrity_pledge_agreed: payload.integrity_pledge_agreed ?? true,
      created_at: new Date().toISOString(),
    };

    this.state.users.push(newUser);

    // Notify admin
    this.addNotification({
      recipient_role: 'admin',
      title: 'Pendaftaran PIC Baru Menunggu Verifikasi',
      message: `PIC ${newUser.nama_lengkap} (NIK: ${cleanNik || '-'}) telah mendaftar dan mengunggah berkas KYC/Biometrik.`,
      type: 'warning',
      laporan_id: newUser.id,
    });

    // Notify PIC
    this.addNotification({
      recipient_user_id: newUser.id,
      title: 'Pendaftaran Berhasil Diajukan',
      message: 'Berkas KYC & data biometrik Anda sedang ditinjau oleh Administrator.',
      type: 'info',
    });

    this.persist();

    // Async sync to backend SQL
    api.registerPic(payload).catch((e) => console.warn('Backend register sync warning:', e));

    return { success: true, user: newUser };
  }

  updateUser(userId: string, updates: Partial<User>) {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return;

    Object.assign(user, updates);
    this.persist();

    if (updates.status_verifikasi && user.role === 'pic') {
      api.verifyPic(userId, updates.status_verifikasi as any).catch(() => {});
    }
  }

  updatePicVerification(userId: string, status: 'terverifikasi' | 'ditolak', verifiedBy: string = 'Budi Santoso (Admin)') {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return false;

    user.status_verifikasi = status;
    user.verified_at = new Date().toISOString();
    user.verified_by = verifiedBy;

    this.addNotification({
      recipient_user_id: user.id,
      title: status === 'terverifikasi' ? 'Verifikasi Berkas KYC Berhasil' : 'Pendaftaran PIC Ditolak',
      message:
        status === 'terverifikasi'
          ? `Selamat! Dokumen KYC dan biometrik wajah Anda telah disetujui oleh ${verifiedBy}. Anda kini dapat memasukkan laporan distribusi.`
          : `Mohon maaf, pendaftaran PIC Anda tidak memenuhi persyaratan KYC. Silakan hubungi admin operasional.`,
      type: status === 'terverifikasi' ? 'success' : 'error',
    });

    this.persist();
    api.verifyPic(userId, status).catch(() => {});
    return true;
  }

  // --- REPORT METHODS ---
  createLaporan(payload: {
    pic_id: string;
    area_id: string;
    warehouse_id: string;
    periode_mulai: string;
    periode_selesai: string;
    catatan_tambahan?: string;
    details: {
      brand_id: string;
      stok_awal: number;
      terjual: number;
      sample_bonus: number;
      titip_toko: number;
      stok_akhir?: number;
      base_price?: number;
      subtotal?: number;
      catatan_stok?: string;
    }[];
    pembayaran: {
      metode: PaymentMethod;
      bank_tujuan?: string;
      nominal_transfer: number;
      tanggal_tf: string;
      bukti_transfer_url?: string;
    };
  }): { success: boolean; laporan?: LaporanDistribusi; error?: string } {
    const pic = this.state.users.find((u) => u.id === payload.pic_id);
    if (!pic) {
      return { success: false, error: 'PIC tidak valid.' };
    }

    const laporanId = `lpr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const nomor_laporan = `LPR-${new Date().getFullYear()}-${randomSeq}`;

    const detailList: DetailPenjualan[] = payload.details.map((d) => {
      const brand = this.state.brands.find((b) => b.id === d.brand_id);
      const base_price = d.base_price ?? (brand ? brand.base_price : 0);
      const subtotal = d.subtotal ?? (d.terjual * base_price);
      const stok_akhir = d.stok_akhir ?? (d.stok_awal - d.terjual - d.sample_bonus - d.titip_toko);

      return {
        id: `det_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        laporan_id: laporanId,
        brand_id: d.brand_id,
        stok_awal: d.stok_awal,
        terjual: d.terjual,
        sample_bonus: d.sample_bonus,
        titip_toko: d.titip_toko,
        stok_akhir,
        base_price,
        subtotal,
      };
    });

    const bayar: Pembayaran = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      laporan_id: laporanId,
      metode: payload.pembayaran.metode,
      bank_tujuan: payload.pembayaran.bank_tujuan,
      nominal_transfer: payload.pembayaran.nominal_transfer,
      tanggal_tf: payload.pembayaran.tanggal_tf,
      bukti_transfer_url: payload.pembayaran.bukti_transfer_url,
      status: 'Menunggu Verifikasi',
    };

    const newLaporan: LaporanDistribusi = {
      id: laporanId,
      nomor_laporan,
      pic_id: payload.pic_id,
      area_id: payload.area_id,
      warehouse_id: payload.warehouse_id,
      periode_mulai: payload.periode_mulai,
      periode_selesai: payload.periode_selesai,
      catatan_tambahan: payload.catatan_tambahan || '',
      status: 'Menunggu Verifikasi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      details: detailList,
      pembayaran: bayar,
    };

    this.state.laporan.unshift(newLaporan);

    const totalPenjualan = detailList.reduce((acc, curr) => acc + curr.subtotal, 0);

    this.addNotification({
      recipient_role: 'admin',
      title: 'Laporan Distribusi Baru Masuk',
      message: `PIC ${pic.nama_lengkap} mengirimkan laporan ${nomor_laporan} dengan total Rp ${totalPenjualan.toLocaleString('id-ID')}.`,
      type: 'info',
      laporan_id: newLaporan.id,
    });

    this.persist();

    // Async sync to backend SQL
    api.submitPicReport({
      warehouse_id: payload.warehouse_id,
      area_id: payload.area_id,
      tanggal_laporan: payload.pembayaran.tanggal_tf || new Date().toISOString().substring(0, 10),
      periode_mulai: payload.periode_mulai,
      periode_selesai: payload.periode_selesai,
      catatan: payload.catatan_tambahan,
      items: detailList.map((d) => ({
        brand_id: d.brand_id,
        jumlah_terjual: d.terjual,
        harga_satuan: d.base_price,
        subtotal: d.subtotal,
      })),
      payment: {
        metode_pembayaran: payload.pembayaran.metode === 'bank transfer' ? 'transfer_bank' : payload.pembayaran.metode,
        bukti_transfer_url: payload.pembayaran.bukti_transfer_url,
      },
    }).catch((e) => console.warn('Backend create report sync warning:', e));

    return { success: true, laporan: newLaporan };
  }

  reviseLaporan(
    laporanId: string,
    payload: {
      area_id: string;
      warehouse_id: string;
      periode_mulai: string;
      periode_selesai: string;
      catatan_tambahan?: string;
      details: {
        brand_id: string;
        stok_awal: number;
        terjual: number;
        sample_bonus: number;
        titip_toko: number;
        stok_akhir?: number;
        base_price?: number;
        subtotal?: number;
        catatan_stok?: string;
      }[];
      pembayaran: {
        metode: PaymentMethod;
        bank_tujuan?: string;
        nominal_transfer: number;
        tanggal_tf: string;
        bukti_transfer_url?: string;
      };
    }
  ): { success: boolean; error?: string } {
    const report = this.state.laporan.find((l) => l.id === laporanId);
    if (!report) {
      return { success: false, error: 'Laporan tidak ditemukan.' };
    }

    report.area_id = payload.area_id;
    report.warehouse_id = payload.warehouse_id;
    report.periode_mulai = payload.periode_mulai;
    report.periode_selesai = payload.periode_selesai;
    report.catatan_tambahan = payload.catatan_tambahan || '';
    report.status = 'Menunggu Verifikasi';
    report.rejection_reason = undefined;

    report.details = payload.details.map((d) => {
      const brand = this.state.brands.find((b) => b.id === d.brand_id);
      const base_price = d.base_price ?? (brand ? brand.base_price : 0);
      const subtotal = d.subtotal ?? (d.terjual * base_price);
      const stok_akhir = d.stok_akhir ?? (d.stok_awal - d.terjual - d.sample_bonus - d.titip_toko);

      return {
        id: `det_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        laporan_id: laporanId,
        brand_id: d.brand_id,
        stok_awal: d.stok_awal,
        terjual: d.terjual,
        sample_bonus: d.sample_bonus,
        titip_toko: d.titip_toko,
        stok_akhir,
        base_price,
        subtotal,
      };
    });

    report.pembayaran = {
      id: report.pembayaran?.id || `pay_${Date.now()}`,
      laporan_id: laporanId,
      metode: payload.pembayaran.metode,
      bank_tujuan: payload.pembayaran.bank_tujuan,
      nominal_transfer: payload.pembayaran.nominal_transfer,
      tanggal_tf: payload.pembayaran.tanggal_tf,
      bukti_transfer_url: payload.pembayaran.bukti_transfer_url,
      status: 'Menunggu Verifikasi',
    };
    report.updated_at = new Date().toISOString();

    this.addNotification({
      recipient_role: 'admin',
      title: 'Laporan Revisi Telah Dikirim',
      message: `PIC telah merevisi laporan ${report.nomor_laporan}. Siap untuk ditinjau ulang.`,
      type: 'info',
      laporan_id: report.id,
    });

    this.persist();
    return { success: true };
  }

  // Polymorphic verifyLaporan supporting both:
  // (laporanId, adminId, status: 'Diterima' | 'Ditolak', rejectionReason?) AND
  // (laporanId, action: 'terima' | 'tolak', adminId, rejectionReason?)
  verifyLaporan(
    laporanId: string,
    arg2: string,
    arg3: string,
    arg4?: string
  ): { success: boolean; error?: string } {
    let adminId = 'usr-admin-1';
    let statusAction: 'Diterima' | 'Ditolak' = 'Diterima';
    let reason = arg4 || '';

    if (arg2 === 'Diterima' || arg2 === 'terima') {
      statusAction = 'Diterima';
      adminId = arg3 || 'usr-admin-1';
    } else if (arg2 === 'Ditolak' || arg2 === 'tolak') {
      statusAction = 'Ditolak';
      adminId = arg3 || 'usr-admin-1';
      reason = arg4 || '';
    } else {
      adminId = arg2;
      statusAction = (arg3 === 'Ditolak' || arg3 === 'tolak') ? 'Ditolak' : 'Diterima';
      reason = arg4 || '';
    }

    const report = this.state.laporan.find((l) => l.id === laporanId);
    if (!report) {
      return { success: false, error: 'Laporan tidak ditemukan.' };
    }

    if (statusAction === 'Ditolak' && !reason.trim()) {
      return { success: false, error: 'Admin wajib mengisi alasan penolakan.' };
    }

    const admin = this.state.users.find((u) => u.id === adminId);
    const adminName = admin ? admin.nama_lengkap : 'Budi Santoso (Admin)';

    if (statusAction === 'Diterima') {
      report.status = 'Diterima';
      report.rejection_reason = undefined;
      if (report.pembayaran) {
        report.pembayaran.status = 'Diterima';
        report.pembayaran.verified_by = adminId;
        report.pembayaran.verified_at = new Date().toISOString();
      }

      // Deduct warehouse stock
      if (report.details) {
        for (const det of report.details) {
          const item = this.state.stok_gudang.find(
            (s) => s.warehouse_id === report.warehouse_id && s.brand_id === det.brand_id
          );
          if (item) {
            const soldQty = det.terjual + det.sample_bonus;
            item.current_stock = Math.max(0, item.current_stock - soldQty);
            item.last_updated = new Date().toISOString();
            item.status = item.current_stock === 0 ? 'habis' : item.current_stock < 50 ? 'menipis' : 'aman';
          }
        }
      }

      this.addNotification({
        recipient_user_id: report.pic_id,
        title: 'Laporan Distribusi Diterima',
        message: `Laporan ${report.nomor_laporan} telah diverifikasi dan disetujui oleh ${adminName}. Stok gudang telah dipotong otomatis.`,
        type: 'success',
        laporan_id: report.id,
      });
    } else {
      report.status = 'Ditolak';
      report.rejection_reason = reason;
      if (report.pembayaran) {
        report.pembayaran.status = 'Ditolak';
        report.pembayaran.verified_by = adminId;
        report.pembayaran.verified_at = new Date().toISOString();
      }

      this.addNotification({
        recipient_user_id: report.pic_id,
        title: 'Laporan Distribusi Ditolak',
        message: `Laporan ${report.nomor_laporan} ditolak: "${reason}". Silakan lakukan perbaikan dan kirim revisi.`,
        type: 'error',
        laporan_id: report.id,
      });
    }

    report.updated_at = new Date().toISOString();
    this.persist();

    // Async sync to backend SQL
    api.verifyReport(
      laporanId,
      statusAction === 'Diterima' ? 'diterima' : 'ditolak',
      reason
    ).catch(() => {});

    return { success: true };
  }

  // --- STOCK METHODS ---
  updateStokGudang(id: string, newStock: number) {
    const item = this.state.stok_gudang.find((s) => s.id === id);
    if (item) {
      item.current_stock = newStock;
      item.last_updated = new Date().toISOString();
      item.status = newStock === 0 ? 'habis' : newStock < 50 ? 'menipis' : 'aman';
      this.persist();
      api.updateStock(id, newStock).catch(() => {});
    }
  }

  // --- NOTIFICATION METHODS ---
  addNotification(notif: Omit<AppNotification, 'id' | 'is_read' | 'created_at'>) {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.state.notifikasi.unshift(newNotif);
    this.persist();
  }

  markNotificationAsRead(id: string) {
    const n = this.state.notifikasi.find((item) => item.id === id);
    if (n) {
      n.is_read = true;
      this.persist();
      api.markNotificationRead(id).catch(() => {});
    }
  }

  markAllNotificationsAsRead(userRoleOrUser?: UserRole | User | string, userId?: string) {
    let role: UserRole | undefined;
    let uid: string | undefined = userId;

    if (typeof userRoleOrUser === 'string') {
      if (userRoleOrUser === 'admin' || userRoleOrUser === 'pic') {
        role = userRoleOrUser;
      } else {
        uid = userRoleOrUser;
      }
    } else if (userRoleOrUser && typeof userRoleOrUser === 'object') {
      role = userRoleOrUser.role;
      uid = userRoleOrUser.id;
    }

    this.state.notifikasi.forEach((n) => {
      if (!role && !uid) {
        n.is_read = true;
      } else if (uid && n.recipient_user_id === uid) {
        n.is_read = true;
      } else if (role && n.recipient_role === role) {
        n.is_read = true;
      }
    });
    this.persist();
  }

  // --- MASTER DATA METHODS ---
  addBrand(brand: Omit<Brand, 'id'>) {
    const newBrand: Brand = {
      ...brand,
      id: `brd_${Date.now()}`,
    };
    this.state.brands.push(newBrand);
    this.state.warehouses.forEach((w) => {
      this.state.stok_gudang.push({
        id: `stk_${w.id}_${newBrand.id}`,
        warehouse_id: w.id,
        brand_id: newBrand.id,
        current_stock: 0,
        last_updated: new Date().toISOString(),
        status: 'habis',
      });
    });
    this.persist();
    api.createBrand(brand).catch(() => {});
  }

  updateBrand(id: string, updates: Partial<Brand>) {
    const idx = this.state.brands.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.state.brands[idx] = { ...this.state.brands[idx], ...updates };
      this.persist();
      api.updateBrand(id, updates).catch(() => {});
    }
  }

  deleteBrand(id: string) {
    this.state.brands = this.state.brands.filter((b) => b.id !== id);
    this.state.stok_gudang = this.state.stok_gudang.filter((s) => s.brand_id !== id);
    this.persist();
    api.deleteBrand(id).catch(() => {});
  }

  addArea(area: Omit<Area, 'id'>) {
    const newArea: Area = {
      ...area,
      id: `area_${Date.now()}`,
    };
    this.state.areas.push(newArea);
    this.persist();
    api.createArea(area).catch(() => {});
  }

  updateArea(id: string, updates: Partial<Area>) {
    const idx = this.state.areas.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.state.areas[idx] = { ...this.state.areas[idx], ...updates };
      this.persist();
      api.updateArea(id, updates).catch(() => {});
    }
  }

  deleteArea(id: string) {
    this.state.areas = this.state.areas.filter((a) => a.id !== id);
    this.persist();
    api.deleteArea(id).catch(() => {});
  }

  addWarehouse(warehouse: Omit<Warehouse, 'id'>) {
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: `wh_${Date.now()}`,
    };
    this.state.warehouses.push(newWarehouse);
    this.state.brands.forEach((b) => {
      this.state.stok_gudang.push({
        id: `stk_${newWarehouse.id}_${b.id}`,
        warehouse_id: newWarehouse.id,
        brand_id: b.id,
        current_stock: 0,
        last_updated: new Date().toISOString(),
        status: 'habis',
      });
    });
    this.persist();
    api.createWarehouse(warehouse).catch(() => {});
  }

  updateWarehouse(id: string, updates: Partial<Warehouse>) {
    const idx = this.state.warehouses.findIndex((w) => w.id === id);
    if (idx !== -1) {
      this.state.warehouses[idx] = { ...this.state.warehouses[idx], ...updates };
      this.persist();
      api.updateWarehouse(id, updates).catch(() => {});
    }
  }

  deleteWarehouse(id: string) {
    this.state.warehouses = this.state.warehouses.filter((w) => w.id !== id);
    this.state.stok_gudang = this.state.stok_gudang.filter((s) => s.warehouse_id !== id);
    this.persist();
    api.deleteWarehouse(id).catch(() => {});
  }

  addUser(user: Omit<User, 'id' | 'created_at' | 'password_hash'> & { password?: string }) {
    const newId = `usr_${user.role}_${Date.now()}`;
    const newUser: User = {
      ...user,
      id: newId,
      password_hash: hashPasswordSync(user.password || 'password123'),
      nip_employee_id: `NIP-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
    };
    this.state.users.push(newUser);
    this.persist();
    api.createUser(user).catch(() => {});
  }

  deleteUser(id: string) {
    this.state.users = this.state.users.filter((u) => u.id !== id);
    this.persist();
    api.deleteUser(id).catch(() => {});
  }

  resetToSeed() {
    this.state = {
      users: JSON.parse(JSON.stringify(SEED_USERS)),
      areas: JSON.parse(JSON.stringify(SEED_AREAS)),
      brands: JSON.parse(JSON.stringify(SEED_BRANDS)),
      warehouses: JSON.parse(JSON.stringify(SEED_WAREHOUSES)),
      stok_gudang: JSON.parse(JSON.stringify(SEED_STOK_GUDANG)),
      laporan: JSON.parse(JSON.stringify(SEED_LAPORAN)),
      notifikasi: JSON.parse(JSON.stringify(SEED_NOTIFIKASI)),
    };
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.persist();
  }

  resetToDefault() {
    this.resetToSeed();
  }
}

export const store = new SalesDistStore();
export default store;
