import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import { store } from '../../db/store';
import { formatRupiah, formatDateID } from '../../utils/calc';
import { LaporanStatus, PaymentMethod } from '../../types';

export const RekapKeuangan: React.FC = () => {
  const db = store.getState();
  const laporanList = db.laporan;
  const brands = db.brands;
  const areas = db.areas;
  const users = db.users;
  const warehouses = db.warehouses;

  // Filters: Tanggal, Area, Metode, Status
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterAreaId, setFilterAreaId] = useState<string>('all');
  const [filterMetode, setFilterMetode] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtered reports
  const filteredReports = laporanList.filter((l) => {
    // Area filter
    if (filterAreaId !== 'all' && l.area_id !== filterAreaId) return false;

    // Status filter
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;

    // Metode filter
    if (filterMetode !== 'all' && l.pembayaran?.metode !== filterMetode) return false;

    // Date filter
    const reportDate = l.created_at.split('T')[0];
    if (filterStartDate && reportDate < filterStartDate) return false;
    if (filterEndDate && reportDate > filterEndDate) return false;

    return true;
  });

  // Approved reports from filtered set
  const approvedReports = filteredReports.filter((l) => l.status === 'Diterima');

  // Summary Metrics
  const totalOmzetTerverifikasi = approvedReports.reduce((acc, l) => {
    return acc + (l.details?.reduce((sum, d) => sum + (d.subtotal || 0), 0) || 0);
  }, 0);

  const totalDanaMasuk = approvedReports.reduce((acc, l) => {
    return acc + (l.pembayaran?.nominal_transfer || 0);
  }, 0);

  const totalPendingDana = filteredReports
    .filter((l) => l.status === 'Menunggu Verifikasi')
    .reduce((acc, l) => acc + (l.pembayaran?.nominal_transfer || 0), 0);

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      'No Laporan',
      'Tanggal Dibuat',
      'Sales PIC',
      'No WhatsApp',
      'Area Distribusi',
      'Gudang Hub',
      'Periode Mulai',
      'Periode Selesai',
      'Metode Pembayaran',
      'Bank Tujuan',
      'Nominal Transfer (Rp)',
      'Status Laporan',
      'Verifikator',
    ];

    const rows = filteredReports.map((l) => {
      const pic = users.find((u) => u.id === l.pic_id);
      const area = areas.find((a) => a.id === l.area_id);
      const wh = warehouses.find((w) => w.id === l.warehouse_id);
      const admin = users.find((u) => u.id === l.pembayaran?.verified_by);

      return [
        `"${l.nomor_laporan}"`,
        `"${l.created_at.split('T')[0]}"`,
        `"${pic?.nama_lengkap || '-'}"`,
        `"${pic?.no_whatsapp || '-'}"`,
        `"${area?.nama_kota_kabupaten || '-'}"`,
        `"${wh?.nama_gudang || '-'}"`,
        `"${l.periode_mulai}"`,
        `"${l.periode_selesai}"`,
        `"${l.pembayaran?.metode || '-'}"`,
        `"${l.pembayaran?.bank_tujuan || '-'}"`,
        l.pembayaran?.nominal_transfer || 0,
        `"${l.status}"`,
        `"${admin?.nama_lengkap || '-'}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap-keuangan-salesdist-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Rekap Keuangan & Arus Kas Distribusi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data rekapitulasi setoran pembayaran penjualan, filter multi-kriteria, dan ekspor CSV resmi.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor CSV ({filteredReports.length} Data)</span>
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-blue-800/40">
          <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider block">
            Total Omzet Disetujui (Valid)
          </span>
          <p className="text-3xl font-black mt-2 tracking-tight text-white">{formatRupiah(totalOmzetTerverifikasi)}</p>
          <div className="mt-4 flex items-center text-xs text-blue-300">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            <span>Dari {approvedReports.length} laporan terverifikasi</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Dana Masuk Kas (Setoran Selesai)
          </span>
          <p className="text-3xl font-black mt-2 tracking-tight text-emerald-600">{formatRupiah(totalDanaMasuk)}</p>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <CreditCard className="w-3.5 h-3.5 mr-1 text-blue-600" />
            <span>Transfer Bank, QRIS, & Tunai</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
            Dana Menunggu Verifikasi
          </span>
          <p className="text-3xl font-black mt-2 tracking-tight text-amber-600">{formatRupiah(totalPendingDana)}</p>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
            <span>Perlu review admin</span>
          </div>
        </div>
      </div>

      {/* Filter Section (Tanggal / Area / Metode / Status) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Laporan & Pembayaran:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Area Wilayah</label>
            <select
              value={filterAreaId}
              onChange={(e) => setFilterAreaId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="all">Semua Area</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama_kota_kabupaten}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Metode Pembayaran</label>
            <select
              value={filterMetode}
              onChange={(e) => setFilterMetode(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="all">Semua Metode</option>
              <option value="bank transfer">Bank Transfer</option>
              <option value="QRIS">QRIS</option>
              <option value="tunai">Tunai</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Verifikasi</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="Diterima">Diterima</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {(filterStartDate || filterEndDate || filterAreaId !== 'all' || filterMetode !== 'all' || filterStatus !== 'all') && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterAreaId('all');
                setFilterMetode('all');
                setFilterStatus('all');
              }}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Tabel Pembayaran & Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">
            Daftar Pembayaran & Laporan Terfilter ({filteredReports.length})
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Total Setoran: {formatRupiah(filteredReports.reduce((s, l) => s + (l.pembayaran?.nominal_transfer || 0), 0))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No. Laporan</th>
                <th className="py-3 px-4">Sales PIC</th>
                <th className="py-3 px-4">Area & Gudang</th>
                <th className="py-3 px-3 text-center">Metode</th>
                <th className="py-3 px-4 text-right">Nominal Setoran</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Verifikator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi pembayaran yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredReports.map((l) => {
                  const pic = users.find((u) => u.id === l.pic_id);
                  const area = areas.find((a) => a.id === l.area_id);
                  const wh = warehouses.find((w) => w.id === l.warehouse_id);
                  const admin = users.find((u) => u.id === l.pembayaran?.verified_by);

                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {l.nomor_laporan}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {formatDateID(l.created_at)}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium">
                        {pic?.nama_lengkap}
                        <span className="block text-[10px] text-slate-400">{pic?.no_whatsapp}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold block">{area?.nama_kota_kabupaten}</span>
                        <span className="text-[10px] text-slate-500">{wh?.nama_gudang}</span>
                      </td>

                      <td className="py-3 px-3 text-center uppercase font-bold text-slate-700">
                        {l.pembayaran?.metode}
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold text-blue-900">
                        {formatRupiah(l.pembayaran?.nominal_transfer || 0)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'Diterima'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'Ditolak'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center text-slate-600 text-[11px]">
                        {admin ? admin.nama_lengkap : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
