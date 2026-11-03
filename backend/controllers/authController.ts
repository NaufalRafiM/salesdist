import { Request, Response } from 'express';
import { db } from '../db/connection';
import { hashPassword, verifyPassword } from '../../src/utils/crypto';

export const authController = {
  // Login with email and password
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      }

      const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;
      if (!user) {
        return res.status(401).json({ error: 'Email atau kata sandi tidak valid.' });
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Email atau kata sandi tidak valid.' });
      }

      // Record audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, aksi, deskripsi, entitas, entitas_id, created_at)
        VALUES (?, ?, 'LOGIN', ?, 'users', ?, datetime('now', 'localtime'))
      `).run(`log_${Date.now()}`, user.id, `User ${user.nama_lengkap} berhasil masuk`, user.id);

      // Return sanitized user (exclude password_hash)
      const { password_hash, ...safeUser } = user;
      return res.json({
        message: 'Login berhasil.',
        user: {
          ...safeUser,
          integrity_pledge_agreed: Boolean(safeUser.integrity_pledge_agreed)
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Terjadi kesalahan sistem saat proses login.' });
    }
  },

  // Register new PIC with biometric and KYC
  registerPic: async (req: Request, res: Response) => {
    try {
      const {
        nama_lengkap,
        email,
        no_whatsapp,
        password,
        nik,
        assigned_area_id,
        address_domicile,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        ktp_photo_url,
        face_photo_url,
        integrity_pledge_agreed
      } = req.body;

      if (!nama_lengkap || !email || !no_whatsapp || !password) {
        return res.status(400).json({ error: 'Data wajib PIC (Nama, Email, WhatsApp, Password) belum lengkap.' });
      }

      // Check email uniqueness
      const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Alamat email sudah terdaftar dalam sistem.' });
      }

      // Check WhatsApp uniqueness
      const existingPhone = db.prepare('SELECT id FROM users WHERE no_whatsapp = ?').get(no_whatsapp);
      if (existingPhone) {
        return res.status(400).json({ error: 'Nomor WhatsApp sudah digunakan oleh akun lain.' });
      }

      // Check NIK uniqueness if provided
      if (nik) {
        const cleanNik = String(nik).replace(/\D/g, '');
        if (cleanNik.length !== 16) {
          return res.status(400).json({ error: 'Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka.' });
        }
        const existingNik = db.prepare('SELECT id FROM users WHERE nik = ?').get(cleanNik);
        if (existingNik) {
          return res.status(400).json({ error: 'NIK tersebut sudah terdaftar pada akun PIC lain.' });
        }
      }

      const password_hash = await hashPassword(password);
      const newId = `usr_pic_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const nip = `NIP-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

      const insertStmt = db.prepare(`
        INSERT INTO users (
          id, nama_lengkap, email, no_whatsapp, password_hash, role, status_verifikasi,
          nik, nip_employee_id, ktp_photo_url, face_photo_url, address_domicile,
          assigned_area_id, emergency_contact_name, emergency_contact_phone,
          emergency_contact_relation, integrity_pledge_agreed, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, 'pic', 'pending',
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime')
        )
      `);

      insertStmt.run(
        newId,
        nama_lengkap,
        email.toLowerCase(),
        no_whatsapp,
        password_hash,
        nik ? String(nik).replace(/\D/g, '') : null,
        nip,
        ktp_photo_url || null,
        face_photo_url || null,
        address_domicile || null,
        assigned_area_id || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        emergency_contact_relation || null,
        integrity_pledge_agreed ? 1 : 0
      );

      // Create notification for admin
      db.prepare(`
        INSERT INTO notifikasi (id, user_id, judul, pesan, tipe, dibaca, tautan_id, created_at)
        VALUES (?, 'usr_admin_01', 'Pendaftaran PIC Baru Menunggu Verifikasi', ?, 'peringatan', 0, ?, datetime('now', 'localtime'))
      `).run(
        `notif_${Date.now()}`,
        `PIC ${nama_lengkap} (NIK: ${nik || '-'}) telah mendaftar dan mengunggah berkas KYC/Biometrik.`,
        newId
      );

      // Create confirmation notification for PIC
      db.prepare(`
        INSERT INTO notifikasi (id, user_id, judul, pesan, tipe, dibaca, created_at)
        VALUES (?, ?, 'Pendaftaran Berhasil Diajukan', 'Berkas KYC & data biometrik Anda sedang ditinjau oleh Administrator.', 'info', 0, datetime('now', 'localtime'))
      `).run(`notif_pic_${Date.now()}`, newId);

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, aksi, deskripsi, entitas, entitas_id, created_at)
        VALUES (?, ?, 'REGISTER_PIC', ?, 'users', ?, datetime('now', 'localtime'))
      `).run(`log_${Date.now()}`, newId, `PIC baru terdaftar dengan status pending`, newId);

      const registeredUser = db.prepare('SELECT * FROM users WHERE id = ?').get(newId) as any;
      const { password_hash: _, ...safeUser } = registeredUser;

      return res.status(201).json({
        message: 'Registrasi berhasil. Akun Anda sedang menunggu verifikasi dokumen & biometrik dari Admin.',
        user: {
          ...safeUser,
          integrity_pledge_agreed: Boolean(safeUser.integrity_pledge_agreed)
        }
      });
    } catch (err: any) {
      console.error('Register PIC error:', err);
      return res.status(500).json({ error: 'Gagal memproses pendaftaran PIC.' });
    }
  },

  // Lookup verification status by NIK, email, or WhatsApp
  lookupStatus: (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Parameter pencarian (query) tidak boleh kosong.' });
      }

      const cleanQuery = query.trim();
      const cleanDigits = cleanQuery.replace(/\D/g, '');

      let user: any = null;
      if (cleanDigits.length === 16) {
        user = db.prepare('SELECT id, nama_lengkap, email, no_whatsapp, role, status_verifikasi, nik, nip_employee_id, created_at, verified_at, verified_by FROM users WHERE nik = ?').get(cleanDigits);
      }
      
      if (!user) {
        user = db.prepare('SELECT id, nama_lengkap, email, no_whatsapp, role, status_verifikasi, nik, nip_employee_id, created_at, verified_at, verified_by FROM users WHERE LOWER(email) = LOWER(?) OR no_whatsapp = ?').get(cleanQuery, cleanQuery);
      }

      if (!user) {
        return res.status(404).json({ error: 'Data personel tidak ditemukan. Pastikan NIK / Email / No. WhatsApp sesuai.' });
      }

      return res.json({ user });
    } catch (err: any) {
      console.error('Lookup status error:', err);
      return res.status(500).json({ error: 'Gagal mencari status verifikasi.' });
    }
  },

  // Get current user profile
  getMe: (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Sesi kedaluwarsa. Silakan login kembali.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const { password_hash, ...safeUser } = user;
    return res.json({
      user: {
        ...safeUser,
        integrity_pledge_agreed: Boolean(safeUser.integrity_pledge_agreed)
      }
    });
  }
};
