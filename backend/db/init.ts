import fs from 'fs';
import path from 'path';
import { db } from './connection';
import {
  SEED_AREAS,
  SEED_WAREHOUSES,
  SEED_BRANDS,
  SEED_STOK_GUDANG,
  SEED_USERS,
  SEED_LAPORAN,
  SEED_NOTIFIKASI
} from '../../src/data/seedData';

export function initializeDatabase() {
  const schemaPath = path.resolve(process.cwd(), 'backend/db/schema.sql');
  const ddl = fs.readFileSync(schemaPath, 'utf-8');

  // Run schema DDL
  db.exec(ddl);

  // Check if users table already has data
  const countUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (countUsers.cnt === 0) {
    console.log('[SQL Database] Seeding initial data from SEED_* fixtures...');
    
    // Use an atomic transaction for complete integrity
    const seedTransaction = db.transaction(() => {
      // 1. Seed Areas
      const insertArea = db.prepare(`
        INSERT OR IGNORE INTO areas (id, nama_area, kode_area, deskripsi, created_at)
        VALUES (@id, @nama_area, @kode_area, @deskripsi, @created_at)
      `);
      for (const a of SEED_AREAS) {
        insertArea.run({
          id: a.id,
          nama_area: a.nama_kota_kabupaten,
          kode_area: `AREA-${a.id.toUpperCase()}`,
          deskripsi: a.region,
          created_at: new Date().toISOString()
        });
      }

      // 2. Seed Warehouses
      const insertWarehouse = db.prepare(`
        INSERT OR IGNORE INTO warehouses (id, nama_gudang, kode_gudang, alamat, area_id, created_at)
        VALUES (@id, @nama_gudang, @kode_gudang, @alamat, @area_id, @created_at)
      `);
      for (const w of SEED_WAREHOUSES) {
        insertWarehouse.run({
          id: w.id,
          nama_gudang: w.nama_gudang,
          kode_gudang: `WH-${w.id.toUpperCase()}`,
          alamat: w.lokasi,
          area_id: 'area-1',
          created_at: new Date().toISOString()
        });
      }

      // 3. Seed Brands
      const insertBrand = db.prepare(`
        INSERT OR IGNORE INTO brands (id, nama_brand, kode_brand, kategori, harga_satuan, deskripsi, is_active, created_at)
        VALUES (@id, @nama_brand, @kode_brand, @kategori, @harga_satuan, @deskripsi, @is_active, @created_at)
      `);
      for (const b of SEED_BRANDS) {
        insertBrand.run({
          id: b.id,
          nama_brand: b.brand_name,
          kode_brand: b.sku_code,
          kategori: b.category,
          harga_satuan: b.base_price,
          deskripsi: b.description,
          is_active: 1,
          created_at: new Date().toISOString()
        });
      }

      // 4. Seed Users
      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (
          id, nama_lengkap, email, no_whatsapp, password_hash, role, status_verifikasi,
          nik, nip_employee_id, ktp_photo_url, face_photo_url, address_domicile,
          assigned_area_id, emergency_contact_name, emergency_contact_phone,
          emergency_contact_relation, integrity_pledge_agreed, verified_at, verified_by,
          created_at, updated_at
        ) VALUES (
          @id, @nama_lengkap, @email, @no_whatsapp, @password_hash, @role, @status_verifikasi,
          @nik, @nip_employee_id, @ktp_photo_url, @face_photo_url, @address_domicile,
          @assigned_area_id, @emergency_contact_name, @emergency_contact_phone,
          @emergency_contact_relation, @integrity_pledge_agreed, @verified_at, @verified_by,
          @created_at, @updated_at
        )
      `);
      for (const u of SEED_USERS) {
        insertUser.run({
          id: u.id,
          nama_lengkap: u.nama_lengkap,
          email: u.email,
          no_whatsapp: u.no_whatsapp,
          password_hash: u.password_hash,
          role: u.role,
          status_verifikasi: u.status_verifikasi,
          nik: u.nik || null,
          nip_employee_id: u.nip_employee_id || null,
          ktp_photo_url: u.ktp_photo_url || null,
          face_photo_url: u.face_photo_url || null,
          address_domicile: u.address_domicile || null,
          assigned_area_id: u.assigned_area_id || null,
          emergency_contact_name: u.emergency_contact_name || null,
          emergency_contact_phone: u.emergency_contact_phone || null,
          emergency_contact_relation: u.emergency_contact_relation || null,
          integrity_pledge_agreed: u.integrity_pledge_agreed ? 1 : 0,
          verified_at: u.verified_at || null,
          verified_by: u.verified_by || null,
          created_at: u.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // 5. Seed Warehouse Stocks
      const insertStok = db.prepare(`
        INSERT OR IGNORE INTO stok_gudang (id, warehouse_id, brand_id, stok_tersedia, stok_minimum, updated_at)
        VALUES (@id, @warehouse_id, @brand_id, @stok_tersedia, @stok_minimum, @updated_at)
      `);
      for (const s of SEED_STOK_GUDANG) {
        insertStok.run({
          id: s.id,
          warehouse_id: s.warehouse_id,
          brand_id: s.brand_id,
          stok_tersedia: s.current_stock,
          stok_minimum: 10,
          updated_at: s.last_updated || new Date().toISOString()
        });
      }

      // 6. Seed Laporan, Detail, and Pembayaran
      const insertLaporan = db.prepare(`
        INSERT OR IGNORE INTO laporan_distribusi (
          id, nomor_laporan, pic_id, warehouse_id, area_id, tanggal_laporan,
          periode_mulai, periode_selesai, catatan, status, alasan_penolakan,
          verified_by, verified_at, total_penjualan, total_unit, created_at, updated_at
        ) VALUES (
          @id, @nomor_laporan, @pic_id, @warehouse_id, @area_id, @tanggal_laporan,
          @periode_mulai, @periode_selesai, @catatan, @status, @alasan_penolakan,
          @verified_by, @verified_at, @total_penjualan, @total_unit, @created_at, @updated_at
        )
      `);

      const insertDetail = db.prepare(`
        INSERT OR IGNORE INTO detail_penjualan (
          id, laporan_id, brand_id, jumlah_terjual, harga_satuan, subtotal, catatan_stok, created_at
        ) VALUES (
          @id, @laporan_id, @brand_id, @jumlah_terjual, @harga_satuan, @subtotal, @catatan_stok, @created_at
        )
      `);

      const insertPembayaran = db.prepare(`
        INSERT OR IGNORE INTO pembayaran (
          id, laporan_id, pic_id, total_tagihan, jumlah_dibayar, metode_pembayaran,
          nomor_referensi, bukti_transfer_url, status_pembayaran, catatan_pembayaran,
          tanggal_pembayaran, verified_at, verified_by, created_at
        ) VALUES (
          @id, @laporan_id, @pic_id, @total_tagihan, @jumlah_dibayar, @metode_pembayaran,
          @nomor_referensi, @bukti_transfer_url, @status_pembayaran, @catatan_pembayaran,
          @tanggal_pembayaran, @verified_at, @verified_by, @created_at
        )
      `);

      for (const l of SEED_LAPORAN) {
        const totalPenjualan = l.details?.reduce((sum, d) => sum + d.subtotal, 0) || 0;
        const totalUnit = l.details?.reduce((sum, d) => sum + d.terjual, 0) || 0;
        const statusSql = l.status === 'Diterima' ? 'diterima' : l.status === 'Ditolak' ? 'ditolak' : 'menunggu_verifikasi';

        insertLaporan.run({
          id: l.id,
          nomor_laporan: l.nomor_laporan,
          pic_id: l.pic_id,
          warehouse_id: l.warehouse_id,
          area_id: l.area_id,
          tanggal_laporan: l.created_at.substring(0, 10),
          periode_mulai: l.periode_mulai,
          periode_selesai: l.periode_selesai,
          catatan: l.catatan_tambahan || '',
          status: statusSql,
          alasan_penolakan: l.rejection_reason || null,
          verified_by: l.pembayaran?.verified_by || null,
          verified_at: l.pembayaran?.verified_at || null,
          total_penjualan: totalPenjualan,
          total_unit: totalUnit,
          created_at: l.created_at || new Date().toISOString(),
          updated_at: l.updated_at || new Date().toISOString()
        });

        if (l.details && Array.isArray(l.details)) {
          for (const d of l.details) {
            insertDetail.run({
              id: d.id,
              laporan_id: l.id,
              brand_id: d.brand_id,
              jumlah_terjual: d.terjual,
              harga_satuan: d.base_price,
              subtotal: d.subtotal,
              catatan_stok: '',
              created_at: l.created_at || new Date().toISOString()
            });
          }
        }

        if (l.pembayaran) {
          const statusBayarSql = l.pembayaran.status === 'Diterima' ? 'lunas' : l.pembayaran.status === 'Ditolak' ? 'dibatalkan' : 'menunggu_konfirmasi';
          const metodeSql = l.pembayaran.metode === 'bank transfer' ? 'transfer_bank' : l.pembayaran.metode === 'QRIS' ? 'giro' : 'tunai';

          insertPembayaran.run({
            id: l.pembayaran.id,
            laporan_id: l.id,
            pic_id: l.pic_id,
            total_tagihan: l.pembayaran.nominal_transfer,
            jumlah_dibayar: l.pembayaran.nominal_transfer,
            metode_pembayaran: metodeSql,
            nomor_referensi: 'REF-' + l.pembayaran.id,
            bukti_transfer_url: l.pembayaran.bukti_transfer_url || '',
            status_pembayaran: statusBayarSql,
            catatan_pembayaran: l.pembayaran.bank_tujuan || '',
            tanggal_pembayaran: l.pembayaran.tanggal_tf,
            verified_at: l.pembayaran.verified_at || null,
            verified_by: l.pembayaran.verified_by || null,
            created_at: l.created_at || new Date().toISOString()
          });
        }
      }

      // 7. Seed Notifications
      const insertNotif = db.prepare(`
        INSERT OR IGNORE INTO notifikasi (id, user_id, judul, pesan, tipe, dibaca, tautan_id, created_at)
        VALUES (@id, @user_id, @judul, @pesan, @tipe, @dibaca, @tautan_id, @created_at)
      `);
      for (const n of SEED_NOTIFIKASI) {
        const tipeSql = n.type === 'success' ? 'sukses' : n.type === 'warning' ? 'peringatan' : n.type === 'error' ? 'bahaya' : 'info';
        insertNotif.run({
          id: n.id,
          user_id: n.recipient_user_id || 'usr-admin-1',
          judul: n.title,
          pesan: n.message,
          tipe: tipeSql,
          dibaca: n.is_read ? 1 : 0,
          tautan_id: n.laporan_id || null,
          created_at: n.created_at || new Date().toISOString()
        });
      }

      // 8. Seed Initial Audit Log
      const insertAudit = db.prepare(`
        INSERT INTO audit_logs (id, user_id, aksi, deskripsi, entitas, entitas_id, metadata_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `);
      insertAudit.run(
        'log_init_01',
        'usr-admin-1',
        'SYSTEM_INITIALIZE',
        'Inisialisasi sistem database SQL relasional SALESDIST ID',
        'database',
        'salesdist.sqlite',
        JSON.stringify({ version: '1.0.0', engine: 'better-sqlite3' })
      );
    });

    seedTransaction();
    console.log('[SQL Database] Seeding completed successfully with atomic transaction.');
  } else {
    console.log(`[SQL Database] Database already initialized with ${countUsers.cnt} users.`);
    // Ensure new brands like Otentik and Mag. Blewah are synced
    const insertBrand = db.prepare(`
      INSERT OR IGNORE INTO brands (id, nama_brand, kode_brand, kategori, harga_satuan, deskripsi, is_active, created_at)
      VALUES (@id, @nama_brand, @kode_brand, @kategori, @harga_satuan, @deskripsi, @is_active, @created_at)
    `);
    for (const b of SEED_BRANDS) {
      insertBrand.run({
        id: b.id,
        nama_brand: b.brand_name,
        kode_brand: b.sku_code,
        kategori: b.category,
        harga_satuan: b.base_price,
        deskripsi: b.description,
        is_active: 1,
        created_at: new Date().toISOString()
      });
    }

    const insertArea = db.prepare(`
      INSERT OR IGNORE INTO areas (id, nama_area, kode_area, deskripsi, created_at)
      VALUES (@id, @nama_area, @kode_area, @deskripsi, @created_at)
    `);
    for (const a of SEED_AREAS) {
      insertArea.run({
        id: a.id,
        nama_area: a.nama_kota_kabupaten,
        kode_area: `AREA-${a.id.toUpperCase()}`,
        deskripsi: a.region,
        created_at: new Date().toISOString()
      });
    }
  }
}
