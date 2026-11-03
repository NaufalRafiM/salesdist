import { Request, Response } from 'express';
import { db } from '../db/connection';

export const adminController = {
  // Get Admin dashboard statistics
  getDashboard: (req: Request, res: Response) => {
    try {
      // 1. Pending verification count
      const pendingReportCount = db.prepare(`
        SELECT COUNT(*) as count FROM laporan_distribusi WHERE status = 'menunggu_verifikasi'
      `).get() as { count: number };

      // 2. Total verified revenue
      const verifiedRevenue = db.prepare(`
        SELECT COALESCE(SUM(total_penjualan), 0) as total FROM laporan_distribusi WHERE status = 'diterima'
      `).get() as { total: number };

      // 3. Sales per Brand (Aggregated directly with SQL JOIN and SUM)
      const salesPerBrand = db.prepare(`
        SELECT 
          b.id,
          b.nama_brand,
          b.kode_brand,
          COALESCE(SUM(d.subtotal), 0) as total_nominal,
          COALESCE(SUM(d.jumlah_terjual), 0) as total_unit
        FROM brands b
        LEFT JOIN detail_penjualan d ON d.brand_id = b.id
        LEFT JOIN laporan_distribusi l ON d.laporan_id = l.id AND l.status = 'diterima'
        GROUP BY b.id, b.nama_brand, b.kode_brand
        ORDER BY total_nominal DESC
      `).all();

      // 4. Sales per Area
      const salesPerArea = db.prepare(`
        SELECT 
          a.id,
          a.nama_area,
          a.kode_area,
          COALESCE(SUM(l.total_penjualan), 0) as total_nominal,
          COUNT(CASE WHEN l.status = 'diterima' THEN 1 END) as jumlah_transaksi
        FROM areas a
        LEFT JOIN laporan_distribusi l ON l.area_id = a.id AND l.status = 'diterima'
        GROUP BY a.id, a.nama_area, a.kode_area
        ORDER BY total_nominal DESC
      `).all();

      // 5. Low warehouse stock items (where stok_tersedia <= stok_minimum)
      const lowStockAlerts = db.prepare(`
        SELECT 
          s.id,
          s.warehouse_id,
          s.brand_id,
          s.stok_tersedia,
          s.stok_minimum,
          w.nama_gudang,
          b.nama_brand
        FROM stok_gudang s
        JOIN warehouses w ON s.warehouse_id = w.id
        JOIN brands b ON s.brand_id = b.id
        WHERE s.stok_tersedia <= s.stok_minimum
        ORDER BY s.stok_tersedia ASC
      `).all();

      // 6. Pending PIC KYC count
      const pendingPicCount = db.prepare(`
        SELECT COUNT(*) as count FROM users WHERE role = 'pic' AND status_verifikasi = 'pending'
      `).get() as { count: number };

      return res.json({
        summary: {
          pending_reports: pendingReportCount.count,
          total_revenue: verifiedRevenue.total,
          low_stock_count: lowStockAlerts.length,
          pending_pic_verifications: pendingPicCount.count
        },
        sales_per_brand: salesPerBrand,
        sales_per_area: salesPerArea,
        low_stock_alerts: lowStockAlerts
      });
    } catch (err: any) {
      console.error('Admin Dashboard error:', err);
      return res.status(500).json({ error: 'Gagal mengambil data ringkasan Admin.' });
    }
  },

  // Get list of pending reports for verification
  getPendingReports: (req: Request, res: Response) => {
    try {
      const reports = db.prepare(`
        SELECT 
          l.*, 
          u.nama_lengkap as pic_nama, u.email as pic_email, u.no_whatsapp as pic_phone, u.nip_employee_id,
          w.nama_gudang, w.alamat as gudang_alamat,
          a.nama_area,
          p.id as pembayaran_id, p.metode_pembayaran, p.status_pembayaran, 
          p.nomor_referensi, p.bukti_transfer_url, p.catatan_pembayaran, p.tanggal_pembayaran
        FROM laporan_distribusi l
        JOIN users u ON l.pic_id = u.id
        JOIN warehouses w ON l.warehouse_id = w.id
        JOIN areas a ON l.area_id = a.id
        LEFT JOIN pembayaran p ON p.laporan_id = l.id
        WHERE l.status = 'menunggu_verifikasi'
        ORDER BY l.created_at ASC
      `).all();

      const getDetails = db.prepare(`
        SELECT d.*, b.nama_brand, b.kode_brand, b.kategori
        FROM detail_penjualan d
        JOIN brands b ON d.brand_id = b.id
        WHERE d.laporan_id = ?
      `);

      const enriched = reports.map((r: any) => ({
        ...r,
        detail_penjualan: getDetails.all(r.id),
        pembayaran: r.pembayaran_id ? {
          id: r.pembayaran_id,
          metode_pembayaran: r.metode_pembayaran,
          status_pembayaran: r.status_pembayaran,
          nomor_referensi: r.nomor_referensi,
          bukti_transfer_url: r.bukti_transfer_url,
          catatan_pembayaran: r.catatan_pembayaran,
          tanggal_pembayaran: r.tanggal_pembayaran,
          total_tagihan: r.total_penjualan,
          jumlah_dibayar: r.total_penjualan
        } : null
      }));

      return res.json({ reports: enriched });
    } catch (err: any) {
      console.error('Get pending reports error:', err);
      return res.status(500).json({ error: 'Gagal mengambil laporan verifikasi.' });
    }
  },

  // Atomically verify (accept or reject) a distribution report
  verifyReport: (req: Request, res: Response) => {
    try {
      const adminId = req.headers['x-user-id'] as string || 'usr_admin_01';
      const { id } = req.params;
      const { status, alasan_penolakan } = req.body;

      if (!status || !['diterima', 'ditolak'].includes(status)) {
        return res.status(400).json({ error: 'Status verifikasi harus "diterima" atau "ditolak".' });
      }

      if (status === 'ditolak' && !alasan_penolakan) {
        return res.status(400).json({ error: 'Alasan penolakan wajib dicantumkan jika laporan ditolak.' });
      }

      const report = db.prepare('SELECT * FROM laporan_distribusi WHERE id = ?').get(id) as any;
      if (!report) {
        return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
      }

      const admin = db.prepare('SELECT nama_lengkap FROM users WHERE id = ?').get(adminId) as any;
      const adminName = admin ? admin.nama_lengkap : 'Budi Santoso (Admin)';

      // CRITICAL: Atomic transaction to update report, payment, deduct stock, create notification, and record audit
      const executeVerification = db.transaction(() => {
        if (status === 'diterima') {
          // 1. Update report status
          db.prepare(`
            UPDATE laporan_distribusi
            SET status = 'diterima',
                alasan_penolakan = NULL,
                verified_by = ?,
                verified_at = datetime('now', 'localtime'),
                updated_at = datetime('now', 'localtime')
            WHERE id = ?
          `).run(adminName, id);

          // 2. Update payment status to 'lunas'
          db.prepare(`
            UPDATE pembayaran
            SET status_pembayaran = 'lunas',
                verified_by = ?,
                verified_at = datetime('now', 'localtime')
            WHERE laporan_id = ?
          `).run(adminName, id);

          // 3. Atomically deduct warehouse stock for each item sold
          const details = db.prepare('SELECT brand_id, jumlah_terjual FROM detail_penjualan WHERE laporan_id = ?').all(id) as any[];
          for (const item of details) {
            // Deduct stock if available, ensure non-negative
            db.prepare(`
              UPDATE stok_gudang
              SET stok_tersedia = MAX(0, stok_tersedia - ?),
                  updated_at = datetime('now', 'localtime')
              WHERE warehouse_id = ? AND brand_id = ?
            `).run(item.jumlah_terjual, report.warehouse_id, item.brand_id);
          }

          // 4. Notify PIC of acceptance
          db.prepare(`
            INSERT INTO notifikasi (id, user_id, judul, pesan, tipe, dibaca, tautan_id, created_at)
            VALUES (?, ?, 'Laporan Distribusi Diterima & Sah', ?, 'sukses', 0, ?, datetime('now', 'localtime'))
          `).run(
            `notif_${Date.now()}`,
            report.pic_id,
            `Laporan ${report.nomor_laporan} telah disetujui oleh ${adminName}. Stok gudang telah dipotong otomatis.`,
            id
          );

          // 5. Audit Log
          db.prepare(`
            INSERT INTO audit_logs (id, user_id, aksi, deskripsi, entitas, entitas_id, metadata_json, created_at)
            VALUES (?, ?, 'APPROVE_REPORT', ?, 'laporan_distribusi', ?, ?, datetime('now', 'localtime'))
          `).run(
            `log_${Date.now()}`,
            adminId,
            `Admin ${adminName} menyetujui laporan ${report.nomor_laporan}`,
            id,
            JSON.stringify({ report_id: id, total: report.total_penjualan })
          );
        } else {
          // REJECTED
          // 1. Update report status
          db.prepare(`
            UPDATE laporan_distribusi
            SET status = 'ditolak',
                alasan_penolakan = ?,
                verified_by = ?,
                verified_at = datetime('now', 'localtime'),
                updated_at = datetime('now', 'localtime')
            WHERE id = ?
          `).run(alasan_penolakan, adminName, id);

          // 2. Update payment status to 'dibatalkan'
          db.prepare(`
            UPDATE pembayaran
            SET status_pembayaran = 'dibatalkan',
                verified_by = ?,
                verified_at = datetime('now', 'localtime')
            WHERE laporan_id = ?
          `).run(adminName, id);

          // 3. Notify PIC with rejection reason
          db.prepare(`
            INSERT INTO notifikasi (id, user_id, judul, pesan, tipe, dibaca, tautan_id, created_at)
            VALUES (?, ?, 'Laporan Distribusi Ditolak', ?, 'bahaya', 0, ?, datetime('now', 'localtime'))
          `).run(
            `notif_${Date.now()}`,
            report.pic_id,
            `Laporan ${report.nomor_laporan} ditolak: "${alasan_penolakan}". Silakan lakukan perbaikan dan kirim revisi.`,
            id
          );

          // 4. Audit Log
          db.prepare(`
            INSERT INTO audit_logs (id, user_id, aksi, deskripsi, entitas, entitas_id, metadata_json, created_at)
            VALUES (?, ?, 'REJECT_REPORT', ?, 'laporan_distribusi', ?, ?, datetime('now', 'localtime'))
          `).run(
            `log_${Date.now()}`,
            adminId,
            `Admin ${adminName} menolak laporan ${report.nomor_laporan} dengan alasan: ${alasan_penolakan}`,
            id,
            JSON.stringify({ reason: alasan_penolakan })
          );
        }
      });

      executeVerification();

      return res.json({
        message: status === 'diterima'
          ? `Laporan ${report.nomor_laporan} berhasil disetujui. Stok gudang terpotong otomatis.`
          : `Laporan ${report.nomor_laporan} ditolak. Notifikasi telah dikirimkan ke PIC terkait.`
      });
    } catch (err: any) {
      console.error('Verify report error:', err);
      return res.status(500).json({ error: 'Gagal memproses verifikasi laporan: ' + err.message });
    }
  },

  // Financial recap with filters and summary
  getFinancialRecap: (req: Request, res: Response) => {
    try {
      const { tanggal_mulai, tanggal_selesai, area_id, metode, status } = req.query;

      let query = `
        SELECT 
          p.*,
          l.nomor_laporan, l.tanggal_laporan,
          u.nama_lengkap as pic_nama, u.nip_employee_id,
          a.nama_area,
          w.nama_gudang
        FROM pembayaran p
        JOIN laporan_distribusi l ON p.laporan_id = l.id
        JOIN users u ON p.pic_id = u.id
        JOIN areas a ON l.area_id = a.id
        JOIN warehouses w ON l.warehouse_id = w.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (tanggal_mulai) {
        query += ` AND p.tanggal_pembayaran >= ?`;
        params.push(tanggal_mulai);
      }
      if (tanggal_selesai) {
        query += ` AND p.tanggal_pembayaran <= ?`;
        params.push(tanggal_selesai);
      }
      if (area_id && area_id !== 'semua') {
        query += ` AND l.area_id = ?`;
        params.push(area_id);
      }
      if (metode && metode !== 'semua') {
        query += ` AND p.metode_pembayaran = ?`;
        params.push(metode);
      }
      if (status && status !== 'semua') {
        query += ` AND p.status_pembayaran = ?`;
        params.push(status);
      }

      query += ` ORDER BY p.created_at DESC`;

      const payments = db.prepare(query).all(...params);

      // Calculate totals
      const totalOmset = payments.reduce((sum: number, p: any) => sum + p.total_tagihan, 0);
      const totalLunas = payments.filter((p: any) => p.status_pembayaran === 'lunas').reduce((sum: number, p: any) => sum + p.jumlah_dibayar, 0);
      const totalPending = payments.filter((p: any) => p.status_pembayaran === 'menunggu_konfirmasi').reduce((sum: number, p: any) => sum + p.total_tagihan, 0);

      return res.json({
        summary: {
          total_transaksi: payments.length,
          total_omset: totalOmset,
          total_lunas: totalLunas,
          total_pending: totalPending
        },
        payments
      });
    } catch (err: any) {
      console.error('Financial recap error:', err);
      return res.status(500).json({ error: 'Gagal mengambil rekap keuangan.' });
    }
  },

  // Export financial recap to CSV
  exportFinancialCsv: (req: Request, res: Response) => {
    try {
      const payments = db.prepare(`
        SELECT 
          p.id,
          l.nomor_laporan,
          l.tanggal_laporan,
          u.nama_lengkap as pic_nama,
          a.nama_area,
          w.nama_gudang,
          p.metode_pembayaran,
          p.nomor_referensi,
          p.total_tagihan,
          p.jumlah_dibayar,
          p.status_pembayaran,
          p.verified_at,
          p.verified_by
        FROM pembayaran p
        JOIN laporan_distribusi l ON p.laporan_id = l.id
        JOIN users u ON p.pic_id = u.id
        JOIN areas a ON l.area_id = a.id
        JOIN warehouses w ON l.warehouse_id = w.id
        ORDER BY p.tanggal_pembayaran DESC
      `).all() as any[];

      const headers = [
        'ID Pembayaran',
        'Nomor Laporan',
        'Tanggal Laporan',
        'Nama PIC',
        'Area Distribusi',
        'Gudang Pengambilan',
        'Metode Pembayaran',
        'Nomor Referensi Bank',
        'Total Tagihan (IDR)',
        'Jumlah Dibayar (IDR)',
        'Status Pembayaran',
        'Tanggal Verifikasi',
        'Diverifikasi Oleh'
      ];

      const rows = payments.map((p) => [
        `"${p.id}"`,
        `"${p.nomor_laporan}"`,
        `"${p.tanggal_laporan}"`,
        `"${p.pic_nama.replace(/"/g, '""')}"`,
        `"${p.nama_area}"`,
        `"${p.nama_gudang}"`,
        `"${p.metode_pembayaran}"`,
        `"${p.nomor_referensi || '-'}"`,
        p.total_tagihan,
        p.jumlah_dibayar,
        `"${p.status_pembayaran}"`,
        `"${p.verified_at || '-'}"`,
        `"${p.verified_by || '-'}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="rekap_keuangan_salesdist_${new Date().toISOString().substring(0, 10)}.csv"`);
      return res.send(csvContent);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      return res.status(500).json({ error: 'Gagal mengekspor data CSV.' });
    }
  },

  // Stock inventory management
  getStockInventory: (req: Request, res: Response) => {
    try {
      const stocks = db.prepare(`
        SELECT 
          s.*,
          w.nama_gudang, w.kode_gudang,
          b.nama_brand, b.kode_brand, b.kategori, b.harga_satuan
        FROM stok_gudang s
        JOIN warehouses w ON s.warehouse_id = w.id
        JOIN brands b ON s.brand_id = b.id
        ORDER BY w.nama_gudang ASC, b.nama_brand ASC
      `).all();

      return res.json({ stocks });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengambil data stok gudang.' });
    }
  },

  // Adjust stock level
  updateStock: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { stok_tersedia, stok_minimum } = req.body;

      if (stok_tersedia === undefined || stok_tersedia < 0) {
        return res.status(400).json({ error: 'Stok tersedia harus berupa angka positif atau nol.' });
      }

      db.prepare(`
        UPDATE stok_gudang
        SET stok_tersedia = ?,
            stok_minimum = COALESCE(?, stok_minimum),
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(stok_tersedia, stok_minimum, id);

      return res.json({ message: 'Stok berhasil diperbarui.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memperbarui stok: ' + err.message });
    }
  },

  // PIC KYC Verification list
  getPicVerifications: (req: Request, res: Response) => {
    try {
      const pics = db.prepare(`
        SELECT 
          u.id, u.nama_lengkap, u.email, u.no_whatsapp, u.role, u.status_verifikasi,
          u.nik, u.nip_employee_id, u.ktp_photo_url, u.face_photo_url, u.address_domicile,
          u.assigned_area_id, u.emergency_contact_name, u.emergency_contact_phone,
          u.emergency_contact_relation, u.integrity_pledge_agreed,
          u.verified_at, u.verified_by, u.created_at,
          a.nama_area
        FROM users u
        LEFT JOIN areas a ON u.assigned_area_id = a.id
        WHERE u.role = 'pic'
        ORDER BY CASE WHEN u.status_verifikasi = 'pending' THEN 0 ELSE 1 END, u.created_at DESC
      `).all();

      return res.json({
        pics: pics.map((p: any) => ({
          ...p,
          integrity_pledge_agreed: Boolean(p.integrity_pledge_agreed)
        }))
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengambil daftar verifikasi PIC.' });
    }
  },

  // Approve or Reject PIC KYC registration
  verifyPic: (req: Request, res: Response) => {
    try {
      const adminId = req.headers['x-user-id'] as string || 'usr_admin_01';
      const { id } = req.params;
      const { status } = req.body; // 'terverifikasi' | 'ditolak'

      if (!['terverifikasi', 'ditolak'].includes(status)) {
        return res.status(400).json({ error: 'Status harus "terverifikasi" atau "ditolak".' });
      }

      const admin = db.prepare('SELECT nama_lengkap FROM users WHERE id = ?').get(adminId) as any;
      const adminName = admin ? admin.nama_lengkap : 'Budi Santoso (Admin)';

      const executePicVerification = db.transaction(() => {
        db.prepare(`
          UPDATE users
          SET status_verifikasi = ?,
              verified_at = datetime('now', 'localtime'),
              verified_by = ?,
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(status, adminName, id);

        // Notify PIC
        db.prepare(`
          INSERT INTO notifikasi (id, user_id, judul, pesan, tipe, dibaca, created_at)
          VALUES (?, ?, ?, ?, ?, 0, datetime('now', 'localtime'))
        `).run(
          `notif_${Date.now()}`,
          id,
          status === 'terverifikasi' ? 'Verifikasi Berkas KYC Berhasil' : 'Pendaftaran PIC Ditolak',
          status === 'terverifikasi'
            ? `Selamat! Dokumen KYC dan biometrik wajah Anda telah disetujui oleh ${adminName}. Anda kini dapat memasukkan laporan distribusi.`
            : `Mohon maaf, pendaftaran PIC Anda tidak memenuhi persyaratan KYC. Silakan hubungi admin operasional.`,
          status === 'terverifikasi' ? 'sukses' : 'bahaya'
        );

        // Audit log
        db.prepare(`
          INSERT INTO audit_logs (id, user_id, aksi, deskripsi, entitas, entitas_id, created_at)
          VALUES (?, ?, 'VERIFY_PIC', ?, 'users', ?, datetime('now', 'localtime'))
        `).run(
          `log_${Date.now()}`,
          adminId,
          `Admin ${adminName} mengubah status verifikasi PIC menjadi ${status}`,
          id
        );
      });

      executePicVerification();

      return res.json({ message: `Status verifikasi PIC berhasil diubah menjadi ${status}.` });
    } catch (err: any) {
      console.error('Verify PIC error:', err);
      return res.status(500).json({ error: 'Gagal memperbarui status PIC: ' + err.message });
    }
  }
};
