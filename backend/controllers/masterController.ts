import { Request, Response } from 'express';
import { db } from '../db/connection';
import { hashPassword } from '../../src/utils/crypto';

export const masterController = {
  // BRANDS
  getBrands: (req: Request, res: Response) => {
    try {
      const brands = db.prepare('SELECT * FROM brands ORDER BY nama_brand ASC').all();
      return res.json({ brands });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengambil data brand.' });
    }
  },

  createBrand: (req: Request, res: Response) => {
    try {
      const { nama_brand, kode_brand, kategori, harga_satuan, deskripsi, is_active } = req.body;
      if (!nama_brand || !kode_brand || harga_satuan === undefined) {
        return res.status(400).json({ error: 'Nama brand, kode brand, dan harga satuan wajib diisi.' });
      }

      const id = `brd_${Date.now()}`;
      db.prepare(`
        INSERT INTO brands (id, nama_brand, kode_brand, kategori, harga_satuan, deskripsi, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `).run(id, nama_brand, kode_brand.toUpperCase(), kategori || 'General', harga_satuan, deskripsi || '', is_active !== false ? 1 : 0);

      // Auto-create zero-stock records for all warehouses
      const warehouses = db.prepare('SELECT id FROM warehouses').all() as { id: string }[];
      const insertStock = db.prepare(`
        INSERT OR IGNORE INTO stok_gudang (id, warehouse_id, brand_id, stok_tersedia, stok_minimum, updated_at)
        VALUES (?, ?, ?, 0, 10, datetime('now', 'localtime'))
      `);
      for (const w of warehouses) {
        insertStock.run(`stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, w.id, id);
      }

      const created = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
      return res.status(201).json({ message: 'Brand berhasil ditambahkan.', brand: created });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal menambahkan brand: ' + err.message });
    }
  },

  updateBrand: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nama_brand, kode_brand, kategori, harga_satuan, deskripsi, is_active } = req.body;

      db.prepare(`
        UPDATE brands
        SET nama_brand = COALESCE(?, nama_brand),
            kode_brand = COALESCE(?, kode_brand),
            kategori = COALESCE(?, kategori),
            harga_satuan = COALESCE(?, harga_satuan),
            deskripsi = COALESCE(?, deskripsi),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
      `).run(nama_brand, kode_brand ? kode_brand.toUpperCase() : null, kategori, harga_satuan, deskripsi, is_active !== undefined ? (is_active ? 1 : 0) : null, id);

      const updated = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
      return res.json({ message: 'Brand berhasil diperbarui.', brand: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memperbarui brand: ' + err.message });
    }
  },

  deleteBrand: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Check if referenced in detail_penjualan
      const used = db.prepare('SELECT COUNT(*) as count FROM detail_penjualan WHERE brand_id = ?').get(id) as { count: number };
      if (used.count > 0) {
        return res.status(400).json({ error: 'Brand tidak dapat dihapus karena sudah memiliki riwayat penjualan.' });
      }

      db.prepare('DELETE FROM stok_gudang WHERE brand_id = ?').run(id);
      db.prepare('DELETE FROM brands WHERE id = ?').run(id);

      return res.json({ message: 'Brand berhasil dihapus.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal menghapus brand: ' + err.message });
    }
  },

  // AREAS
  getAreas: (req: Request, res: Response) => {
    try {
      const areas = db.prepare('SELECT * FROM areas ORDER BY nama_area ASC').all();
      return res.json({ areas });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengambil data area.' });
    }
  },

  createArea: (req: Request, res: Response) => {
    try {
      const { nama_area, kode_area, deskripsi } = req.body;
      if (!nama_area || !kode_area) {
        return res.status(400).json({ error: 'Nama area dan kode area wajib diisi.' });
      }

      const id = `area_${Date.now()}`;
      db.prepare(`
        INSERT INTO areas (id, nama_area, kode_area, deskripsi, created_at)
        VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
      `).run(id, nama_area, kode_area.toUpperCase(), deskripsi || '');

      const created = db.prepare('SELECT * FROM areas WHERE id = ?').get(id);
      return res.status(201).json({ message: 'Area berhasil ditambahkan.', area: created });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal menambahkan area: ' + err.message });
    }
  },

  updateArea: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nama_area, kode_area, deskripsi } = req.body;

      db.prepare(`
        UPDATE areas
        SET nama_area = COALESCE(?, nama_area),
            kode_area = COALESCE(?, kode_area),
            deskripsi = COALESCE(?, deskripsi)
        WHERE id = ?
      `).run(nama_area, kode_area ? kode_area.toUpperCase() : null, deskripsi, id);

      const updated = db.prepare('SELECT * FROM areas WHERE id = ?').get(id);
      return res.json({ message: 'Area berhasil diperbarui.', area: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memperbarui area: ' + err.message });
    }
  },

  deleteArea: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const warehouses = db.prepare('SELECT COUNT(*) as count FROM warehouses WHERE area_id = ?').get(id) as { count: number };
      if (warehouses.count > 0) {
        return res.status(400).json({ error: 'Area masih memiliki gudang terdaftar dan tidak dapat dihapus.' });
      }

      db.prepare('DELETE FROM areas WHERE id = ?').run(id);
      return res.json({ message: 'Area berhasil dihapus.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal menghapus area: ' + err.message });
    }
  },

  // WAREHOUSES
  getWarehouses: (req: Request, res: Response) => {
    try {
      const warehouses = db.prepare(`
        SELECT w.*, a.nama_area
        FROM warehouses w
        LEFT JOIN areas a ON w.area_id = a.id
        ORDER BY w.nama_gudang ASC
      `).all();
      return res.json({ warehouses });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengambil data gudang.' });
    }
  },

  createWarehouse: (req: Request, res: Response) => {
    try {
      const { nama_gudang, kode_gudang, alamat, area_id } = req.body;
      if (!nama_gudang || !kode_gudang || !alamat || !area_id) {
        return res.status(400).json({ error: 'Semua kolom gudang wajib diisi lengkap.' });
      }

      const id = `wh_${Date.now()}`;
      db.prepare(`
        INSERT INTO warehouses (id, nama_gudang, kode_gudang, alamat, area_id, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `).run(id, nama_gudang, kode_gudang.toUpperCase(), alamat, area_id);

      // Auto initialize stock for all active brands
      const brands = db.prepare('SELECT id FROM brands').all() as { id: string }[];
      const insertStock = db.prepare(`
        INSERT OR IGNORE INTO stok_gudang (id, warehouse_id, brand_id, stok_tersedia, stok_minimum, updated_at)
        VALUES (?, ?, ?, 0, 10, datetime('now', 'localtime'))
      `);
      for (const b of brands) {
        insertStock.run(`stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, id, b.id);
      }

      const created = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id);
      return res.status(201).json({ message: 'Gudang berhasil ditambahkan.', warehouse: created });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal menambahkan gudang: ' + err.message });
    }
  },

  updateWarehouse: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nama_gudang, kode_gudang, alamat, area_id } = req.body;

      db.prepare(`
        UPDATE warehouses
        SET nama_gudang = COALESCE(?, nama_gudang),
            kode_gudang = COALESCE(?, kode_gudang),
            alamat = COALESCE(?, alamat),
            area_id = COALESCE(?, area_id)
        WHERE id = ?
      `).run(nama_gudang, kode_gudang ? kode_gudang.toUpperCase() : null, alamat, area_id, id);

      const updated = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id);
      return res.json({ message: 'Gudang berhasil diperbarui.', warehouse: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memperbarui gudang: ' + err.message });
    }
  },

  deleteWarehouse: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const reports = db.prepare('SELECT COUNT(*) as count FROM laporan_distribusi WHERE warehouse_id = ?').get(id) as { count: number };
      if (reports.count > 0) {
        return res.status(400).json({ error: 'Gudang tidak dapat dihapus karena telah tercatat dalam laporan distribusi.' });
      }

      db.prepare('DELETE FROM stok_gudang WHERE warehouse_id = ?').run(id);
      db.prepare('DELETE FROM warehouses WHERE id = ?').run(id);

      return res.json({ message: 'Gudang berhasil dihapus.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal menghapus gudang: ' + err.message });
    }
  },

  // USERS
  getUsers: (req: Request, res: Response) => {
    try {
      const users = db.prepare(`
        SELECT 
          u.id, u.nama_lengkap, u.email, u.no_whatsapp, u.role, u.status_verifikasi,
          u.nik, u.nip_employee_id, u.ktp_photo_url, u.face_photo_url, u.address_domicile,
          u.assigned_area_id, u.emergency_contact_name, u.emergency_contact_phone,
          u.emergency_contact_relation, u.integrity_pledge_agreed,
          u.verified_at, u.verified_by, u.created_at,
          a.nama_area
        FROM users u
        LEFT JOIN areas a ON u.assigned_area_id = a.id
        ORDER BY u.created_at DESC
      `).all();

      return res.json({
        users: users.map((u: any) => ({
          ...u,
          integrity_pledge_agreed: Boolean(u.integrity_pledge_agreed)
        }))
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengambil data user.' });
    }
  },

  createUser: async (req: Request, res: Response) => {
    try {
      const {
        nama_lengkap,
        email,
        no_whatsapp,
        password,
        role,
        status_verifikasi,
        nik,
        assigned_area_id,
        address_domicile,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation
      } = req.body;

      if (!nama_lengkap || !email || !no_whatsapp || !password || !role) {
        return res.status(400).json({ error: 'Kolom Nama, Email, WhatsApp, Password, dan Role wajib diisi.' });
      }

      const password_hash = await hashPassword(password);
      const id = `usr_${role}_${Date.now()}`;
      const nip = `NIP-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

      db.prepare(`
        INSERT INTO users (
          id, nama_lengkap, email, no_whatsapp, password_hash, role, status_verifikasi,
          nik, nip_employee_id, address_domicile, assigned_area_id,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
          integrity_pledge_agreed, verified_at, verified_by, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          1, datetime('now', 'localtime'), 'Administrator', datetime('now', 'localtime'), datetime('now', 'localtime')
        )
      `).run(
        id,
        nama_lengkap,
        email.toLowerCase(),
        no_whatsapp,
        password_hash,
        role,
        status_verifikasi || (role === 'admin' ? 'terverifikasi' : 'pending'),
        nik || null,
        nip,
        address_domicile || null,
        assigned_area_id || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        emergency_contact_relation || null
      );

      return res.status(201).json({ message: 'User berhasil dibuat.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal menambahkan user: ' + err.message });
    }
  },

  deleteUser: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (id === 'usr_admin_01') {
        return res.status(400).json({ error: 'Akun Super Admin utama tidak boleh dihapus.' });
      }

      db.prepare('DELETE FROM notifikasi WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return res.json({ message: 'User berhasil dihapus.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal menghapus user: ' + err.message });
    }
  }
};
