import React from 'react';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Package,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { User, LaporanDistribusi } from '../../types';
import { store } from '../../db/store';
import { formatRupiah, formatDateID } from '../../utils/calc';

interface PICDashboardProps {
  currentUser: User;
  onNavigateToForm: () => void;
  onNavigateToHistory: () => void;
  onReviseReport: (report: LaporanDistribusi) => void;
}

export const PICDashboard: React.FC<PICDashboardProps> = ({
  currentUser,
  onNavigateToForm,
  onNavigateToHistory,
  onReviseReport,
}) => {
  const db = store.getState();
  const myReports = db.laporan.filter((l) => l.pic_id === currentUser.id);

  const pendingReports = myReports.filter((r) => r.status === 'Menunggu Verifikasi');
  const acceptedReports = myReports.filter((r) => r.status === 'Diterima');
  const rejectedReports = myReports.filter((r) => r.status === 'Ditolak');

  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
  const totalTerjualBulanIni = myReports
    .filter((r) => r.created_at.startsWith(currentMonthPrefix) && r.status !== 'Ditolak')
    .reduce((acc, r) => {
      const sold = r.details?.reduce((sum, d) => sum + (d.terjual || 0), 0) || 0;
      return acc + sold;
    }, 0);

  const totalOmzetDisetujui = acceptedReports.reduce((acc, r) => {
    const reportTotal = r.details?.reduce((sum, d) => sum + (d.subtotal || 0), 0) || 0;
    return acc + reportTotal;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold mb-3 border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Portal Sales PIC Lapangan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Semangat Pagi, {currentUser.nama_lengkap}! 👋
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-2 max-w-xl leading-relaxed">
            Laporkan penjualan toko dan setoran transfer harian secara real-time. Stok akhir dihitung otomatis dan langsung diverifikasi admin.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToForm}
              className="px-5 py-3 rounded-xl bg-white text-blue-900 font-bold text-sm shadow-md hover:bg-blue-50 hover:shadow-lg transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              <span>+ Input Laporan Distribusi</span>
            </button>
            <button
              onClick={onNavigateToHistory}
              className="px-5 py-3 rounded-xl bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-sm border border-blue-400/30 transition flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Lihat Semua Riwayat ({myReports.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Action Banner: Rejected Reports needing revision */}
      {rejectedReports.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-rose-950">
                  Perhatian: Ada {rejectedReports.length} Laporan Ditolak yang Perlu Direvisi!
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Laporan: <strong>{rejectedReports[0].nomor_laporan}</strong> ditolak oleh Admin. Alasan: &quot;{rejectedReports[0].rejection_reason}&quot;
                </p>
              </div>
            </div>
            <button
              onClick={() => onReviseReport(rejectedReports[0])}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revisi Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Laporan</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{myReports.length}</p>
          <span className="text-[11px] text-slate-400">Total diajukan</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase">Menunggu</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-amber-900 mt-2">{pendingReports.length}</p>
          <span className="text-[11px] text-amber-700">Verifikasi admin</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase">Diterima</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-900 mt-2">{acceptedReports.length}</p>
          <span className="text-[11px] text-emerald-700">Disetujui</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase">Terjual Bulan Ini</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-purple-900 mt-2">{totalTerjualBulanIni} <span className="text-xs font-normal text-slate-500">pack</span></p>
          <span className="text-[11px] text-purple-700">Volume bulan ini</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase">Omzet Valid</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-base font-extrabold text-blue-900 mt-2 truncate">{formatRupiah(totalOmzetDisetujui)}</p>
          <span className="text-[11px] text-blue-700">Total omzet diterima</span>
        </div>
      </div>

      {/* Recent Reports Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">Laporan Distribusi Terakhir</h3>
          <button
            onClick={onNavigateToHistory}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Buka Riwayat Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {myReports.slice(0, 3).map((rep) => {
            const area = db.areas.find((a) => a.id === rep.area_id);
            const totalOmzet = rep.details?.reduce((acc, d) => acc + (d.subtotal || 0), 0) || 0;

            return (
              <div key={rep.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{rep.nomor_laporan}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rep.status === 'Diterima'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rep.status === 'Ditolak'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {area?.nama_kota_kabupaten} &bull; Periode: {formatDateID(rep.periode_mulai)} - {formatDateID(rep.periode_selesai)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-xs text-slate-900">{formatRupiah(totalOmzet)}</p>
                  <span className="text-[10px] text-slate-500 capitalize">{rep.pembayaran?.metode}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catalog Reference for PIC in Field */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <Package className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900">Daftar Harga Produk & SKU (Katalog Lapangan)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {db.brands.map((b) => (
            <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                  {b.sku_code}
                </span>
                <span className="font-bold text-slate-900">{formatRupiah(b.base_price)}</span>
              </div>
              <p className="font-bold text-slate-800 mt-1 truncate">{b.brand_name}</p>
              <p className="text-[11px] text-slate-500">{b.category} &bull; Satuan: {b.unit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
