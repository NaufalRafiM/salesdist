import { Request, Response } from 'express';
import { db } from '../db/connection';

export const picController = {
  // Get PIC dashboard statistics
  getDashboard: (req: Request, res: Response) => {
    try {
      const picId = req.headers['x-user-id'] as string;
      if (!picId) {
        return res.status(401).json({ error: 'Identifikasi PIC tidak ditemukan.' });
      }

      // 1. Report counts by status
      const counts = db.prepare(`
        SELECT 
          COUNT(*) as total_laporan,
          SUM(CASE WHEN status = 'menunggu_verifikasi' THEN 1 ELSE 0 END) as menunggu,
          SUM(CASE WHEN status = 'diterima' THEN 1 ELSE 0 END) as diterima,
          SUM(CASE WHEN status = 'ditolak' THEN 1 ELSE 0 END) as ditolak,
          COALESCE(SUM(CASE WHEN status = 'diterima' THEN total_penjualan ELSE 0 END), 0) as total_omset_diterima,
          COALESCE(SUM(CASE WHEN status = 'diterima' THEN total_unit ELSE 0 END), 0) as total_unit_terjual
        FROM laporan_distribusi
        WHERE pic_id = ?
      `).get(picId) as any;

      // 2. Total sold this current month
      const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
      const monthlyStats = db.prepare(`
        SELECT 
          COALESCE(SUM(total_unit), 0) as unit_bulan_ini,
          COALESCE(SUM(total_penjualan), 0) as omset_bulan_ini
        FROM laporan_distribusi
        WHERE pic_id = ? AND status = 'diterima' AND strftime('%Y-%m', tanggal_laporan) = ?
      `).get(picId, currentMonth) as any;

      // 3. Unread notifications
      const notifCount = db.prepare(`
        SELECT COUNT(*) as unread FROM notifikasi WHERE user_id = ? AND dibaca = 0
      `).get(picId) as any;

      // 4. Recent reports
      const recentReports = db.prepare(`
        SELECT l.*, w.nama_gudang, a.nama_area
        FROM laporan_distribusi l
        LEFT JOIN warehouses w ON l.warehouse_id = w.id
        LEFT JOIN areas a ON l.area_id = a.id
        WHERE l.pic_id = ?
        ORDER BY l.created_at DESC
        LIMIT 5
      `).all(picId);

      return res.json({
        summary: {
          total_laporan: counts.total_laporan || 0,
          menunggu: counts.menunggu || 0,
          diterima: counts.diterima || 0,
          ditolak: counts.ditolak || 0,
          total_omset_diterima: counts.total_omset_diterima || 0,
          total_unit_terjual: counts.total_unit_terjual || 0,
          unit_bulan_ini: monthlyStats.unit_bulan_ini || 0,
          omset_bulan_ini: monthlyStats.omset_bulan_ini || 0,
          unread_notifications: notifCount.unread || 0
        },
        recent_reports: recentReports
      });
    } catch (err: any) {
      console.error('PIC Dashboard error:', err);
      return res.status(500).json({ error: 'Gagal mengambil data ringkasan PIC.' });
    }
  },

  // Get reports for logged in PIC
  getReports: (req: Request, res: Response) => {
    try {
      const picId = req.headers['x-user-id'] as string;
      const { status, periode_mulai, periode_selesai, search } = req.query;

      let query = `
        SELECT l.*, w.nama_gudang, a.nama_area,
               p.metode_pembayaran, p.status_pembayaran, p.bukti_transfer_url, p.nomor_referensi
        FROM laporan_distribusi l
        LEFT JOIN warehouses w ON l.warehouse_id = w.id
        LEFT JOIN areas a ON l.area_id = a.id
        LEFT JOIN pembayaran p ON p.laporan_id = l.id
        WHERE l.pic_id = ?
      `;
      const params: any[] = [picId];

      if (status && status !== 'semua') {
        query += ` AND l.status = ?`;
        params.push(status);
      }

      if (periode_mulai) {
        query += ` AND l.tanggal_laporan >= ?`;
        params.push(periode_mulai);
      }

      if (periode_selesai) {
        query += ` AND l.tanggal_laporan <= ?`;
        params.push(periode_selesai);
      }

      if (search) {
        query += ` AND (l.nomor_laporan LIKE ? OR l.catatan LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY l.created_at DESC`;

      const reports = db.prepare(query).all(...params);

      // Hydrate with detail items
      const getDetails = db.prepare(`
        SELECT d.*, b.nama_brand, b.kode_brand
        FROM detail_penjualan d
        LEFT JOIN brands b ON d.brand_id = b.id
        WHERE d.laporan_id = ?
      `);

      const enrichedReports = reports.map((r: any) => ({
        ...r,
        detail_penjualan: getDetails.all(r.id),
        pembayaran: r.status_pembayaran ? {
          metode_pembayaran: r.metode_pembayaran,
          status_pembayaran: r.status_pembayaran,
          bukti_transfer_url: r.bukti_transfer_url,
          nomor_referensi: r.nomor_referensi,
          total_tagihan: r.total_penjualan,
          jumlah_dibayar: r.total_penjualan
        } : null
      }));

      return res.json({ reports: enrichedReports });
    } catch (err: any) {
      console.error('Get PIC reports error:', err);
      return res.status(500).json({ error: 'Gagal mengambil riwayat laporan.' });
    }
  },

  // Submit new distribution report with items and payment in 1 atomic transaction
  submitReport: (req: Request, res: Response) => {
    try {
      const picId = req.headers['x-user-id'] as string;
      const {
        warehouse_id,
        area_id,
        tanggal_laporan,
        periode_mulai,
        periode_selesai,
        catatan,
        items, // array of { brand_id, jumlah_terjual, harga_satuan, subtotal, catatan_stok }
        payment // { metode_pembayaran, nomor_referensi, bukti_transfer_url, catatan_pembayaran }
      } = req.body;

      if (!picId || !warehouse_id || !area_id || !tanggal_laporan || !items || !items.length) {
        return res.status(400).json({ error: 'Kelengkapan formulir laporan belum terpenuhi.' });
      }

      const total_penjualan = items.reduce((sum: number, it: any) => sum + (Number(it.subtotal) || 0), 0);
      const total_unit = items.reduce((sum: number, it: any) => sum + (Number(it.jumlah_terjual) || 0), 0);

      const laporanId = `lpr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const randomSeq = Math.floor(100 + Math.random() * 900);
      const nomor_laporan = `LPR-${new Date().getFullYear()}-${randomSeq}`;

      // ATOMIC TRANSACTION: Insert Laporan, Details, Pembayaran, Notification, Audit
      const executeTransaction = db.transaction(() => {
        // 1. Insert Laporan
        db.prepare(`
          INSERT INTO laporan_distribusi (
            id, nomor_laporan, pic_id, warehouse_id, area_id, tanggal_laporan,
            periode_mulai, periode_selesai, catatan, status, total_penjualan, total_unit,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'menunggu_verifikasi', ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
        `).run(
          laporanId,
          nomor_laporan,
          picId,
          warehouse_id,
          area_id,
          tanggal_laporan,
          periode_mulai || tanggal_laporan,
          periode_selesai || tanggal_laporan,
          catatan || '',
          total_penjualan,
          total_unit
        );

        // 2. Insert Detail Items
        const insertDetail = db.prepare(`
          INSERT INTO detail_penjualan (
            id, laporan_id, brand_id, jumlah_terjual, harga_satuan, subtotal, catatan_stok, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `);

        for (const item of items) {
          insertDetail.run(
            `det_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            laporanId,
            item.brand_id,
            item.jumlah_terjual,
            item.harga_satuan,
            item.subtotal,
            item.catatan_stok || ''
          );
        }

        // 3. Insert Pembayaran
        if (payment) {
          db.prepare(`
            INSERT INTO pembayaran (
              id, laporan_id, pic_id, total_tagihan, jumlah_dibayar, metode_pembayaran,
              nomor_referensi, bukti_transfer_url, status_pembayaran, catatan_pembayaran,
              tanggal_pembayaran, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'menunggu_konfirmasi', ?, ?, datetime('now', 'localtime'))
          `).run(
            `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            laporanId,
            picId,
            total_penjualan,
            total_penjualan,
            payment.metode_pembayaran || 'transfer_bank',
            payment.nomor_referensi || '',
            payment.bukti_transfer_url || '',
            payment.catatan_pembayaran || '',
            tanggal_laporan
          );
        }

        // 4. Notify Admin
        db.prepare(`
          INSERT INTO notifikasi (id, user_id, judul, pesan, tipe, dibaca, tautan_id, created_at)
          VALUES (?, 'usr_admin_01', 'Laporan Distribusi Baru Menunggu Verifikasi', ?, 'info', 0, ?, datetime('now', 'localtime'))
        `).run(
          `notif_${Date.now()}`,
          `Laporan ${nomor_laporan} dengan total Rp ${total_penjualan.toLocaleString('id-ID')} (${total_unit} unit) telah dikirim.`,
          laporanId
        );

        // 5. Audit Log
        db.prepare(`
          INSERT INTO audit_logs (id, user_id, aksi, deskripsi, entitas, entitas_id, metadata_json, created_at)
          VALUES (?, ?, 'SUBMIT_REPORT', ?, 'laporan_distribusi', ?, ?, datetime('now', 'localtime'))
        `).run(
          `log_${Date.now()}`,
          picId,
          `PIC mengajukan laporan distribusi ${nomor_laporan}`,
          laporanId,
          JSON.stringify({ total_penjualan, total_unit, items_count: items.length })
        );
      });

      executeTransaction();

      return res.status(201).json({
        message: 'Laporan berhasil dikirim dan tersimpan di database SQL. Menunggu verifikasi admin.',
        nomor_laporan,
        laporan_id: laporanId
      });
    } catch (err: any) {
      console.error('Submit report error:', err);
      return res.status(500).json({ error: 'Gagal menyimpan laporan ke database: ' + err.message });
    }
  },

  // Revise rejected report
  reviseReport: (req: Request, res: Response) => {
    try {
      const picId = req.headers['x-user-id'] as string;
      const { id } = req.params;
      const { items, payment, catatan, warehouse_id, area_id } = req.body;

      const report = db.prepare('SELECT * FROM laporan_distribusi WHERE id = ?').get(id) as any;
      if (!report) {
        return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
      }

      if (report.pic_id !== picId) {
        return res.status(403).json({ error: 'Anda tidak berhak merevisi laporan ini.' });
      }

      const total_penjualan = items.reduce((sum: number, it: any) => sum + (Number(it.subtotal) || 0), 0);
      const total_unit = items.reduce((sum: number, it: any) => sum + (Number(it.jumlah_terjual) || 0), 0);

      const executeRevision = db.transaction(() => {
        // 1. Update Laporan
        db.prepare(`
          UPDATE laporan_distribusi
          SET status = 'menunggu_verifikasi',
              alasan_penolakan = NULL,
              total_penjualan = ?,
              total_unit = ?,
              catatan = ?,
              warehouse_id = COALESCE(?, warehouse_id),
              area_id = COALESCE(?, area_id),
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(total_penjualan, total_unit, catatan || report.catatan, warehouse_id, area_id, id);

        // 2. Re-insert items
        db.prepare('DELETE FROM detail_penjualan WHERE laporan_id = ?').run(id);
        const insertDetail = db.prepare(`
          INSERT INTO detail_penjualan (id, laporan_id, brand_id, jumlah_terjual, harga_satuan, subtotal, catatan_stok, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `);
        for (const item of items) {
          insertDetail.run(
            `det_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            id,
            item.brand_id,
            item.jumlah_terjual,
            item.harga_satuan,
            item.subtotal,
            item.catatan_stok || ''
          );
        }

        // 3. Update payment
        if (payment) {
          db.prepare(`
            UPDATE pembayaran
            SET status_pembayaran = 'menunggu_konfirmasi',
                total_tagihan = ?,
                jumlah_dibayar = ?,
                metode_pembayaran = COALESCE(?, metode_pembayaran),
                nomor_referensi = COALESCE(?, nomor_referensi),
                bukti_transfer_url = COALESCE(?, bukti_transfer_url),
                catatan_pembayaran = COALESCE(?, catatan_pembayaran)
            WHERE laporan_id = ?
          `).run(
            total_penjualan,
            total_penjualan,
            payment.metode_pembayaran,
            payment.nomor_referensi,
            payment.bukti_transfer_url,
            payment.catatan_pembayaran,
            id
          );
        }

        // 4. Notify admin
        db.prepare(`
          INSERT INTO notifikasi (id, user_id, judul, pesan, tipe, dibaca, tautan_id, created_at)
          VALUES (?, 'usr_admin_01', 'Laporan Telah Direvisi PIC', ?, 'info', 0, ?, datetime('now', 'localtime'))
        `).run(`notif_${Date.now()}`, `PIC telah merevisi laporan ${report.nomor_laporan}. Siap diverifikasi kembali.`, id);

        // 5. Audit log
        db.prepare(`
          INSERT INTO audit_logs (id, user_id, aksi, deskripsi, entitas, entitas_id, created_at)
          VALUES (?, ?, 'REVISE_REPORT', ?, 'laporan_distribusi', ?, datetime('now', 'localtime'))
        `).run(`log_${Date.now()}`, picId, `PIC mengirim revisi untuk laporan ${report.nomor_laporan}`, id);
      });

      executeRevision();

      return res.json({ message: 'Laporan berhasil direvisi dan diajukan ulang ke Admin.' });
    } catch (err: any) {
      console.error('Revise report error:', err);
      return res.status(500).json({ error: 'Gagal memproses revisi laporan: ' + err.message });
    }
  },

  // Get notifications for user
  getNotifications: (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const notifications = db.prepare(`
        SELECT * FROM notifikasi WHERE user_id = ? ORDER BY created_at DESC LIMIT 30
      `).all(userId);

      return res.json({ notifications });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengambil notifikasi.' });
    }
  },

  // Mark notification as read
  markNotificationRead: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      db.prepare('UPDATE notifikasi SET dibaca = 1 WHERE id = ?').run(id);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memperbarui notifikasi.' });
    }
  }
};
