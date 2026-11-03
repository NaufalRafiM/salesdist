import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  CreditCard,
  Building2,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { User, LaporanDistribusi, LaporanStatus } from '../../types';
import { store } from '../../db/store';
import { formatRupiah, formatDateID } from '../../utils/calc';

interface RiwayatLaporanProps {
  currentUser: User;
  onReviseReport: (report: LaporanDistribusi) => void;
  onOpenCreateForm: () => void;
}

export const RiwayatLaporan: React.FC<RiwayatLaporanProps> = ({
  currentUser,
  onReviseReport,
  onOpenCreateForm,
}) => {
  const db = store.getState();
  const areas = db.areas;
  const brands = db.brands;
  const warehouses = db.warehouses;

  // Filter reports submitted by current PIC
  const myReports = db.laporan.filter((l) => l.pic_id === currentUser.id);

  const [statusFilter, setStatusFilter] = useState<'Semua' | LaporanStatus>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReportDetail, setSelectedReportDetail] = useState<LaporanDistribusi | null>(null);
  const [zoomReceipt, setZoomReceipt] = useState(false);

  const filteredReports = myReports.filter((r) => {
    const matchesStatus = statusFilter === 'Semua' || r.status === statusFilter;
    const area = areas.find((a) => a.id === r.area_id)?.nama_kota_kabupaten || '';
    const matchesSearch =
      r.nomor_laporan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: LaporanStatus) => {
    switch (status) {
      case 'Diterima':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Diterima
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Ditolak (Perlu Revisi)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Menunggu Verifikasi
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Riwayat Laporan Distribusi</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status verifikasi dan bukti pembayaran yang telah Anda kirimkan dari lapangan.
          </p>
        </div>
        <button
          onClick={onOpenCreateForm}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
        >
          <span>+ Buat Laporan Baru</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['Semua', 'Menunggu Verifikasi', 'Diterima', 'Ditolak'] as Array<'Semua' | LaporanStatus>).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st} ({st === 'Semua' ? myReports.length : myReports.filter((r) => r.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor atau area..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Laporan Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'Semua'
              ? 'Tidak ada laporan yang sesuai dengan filter atau kata kunci pencarian.'
              : 'Anda belum membuat laporan distribusi lapangan. Tekan tombol buat laporan baru.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const area = areas.find((a) => a.id === report.area_id);
            const warehouse = warehouses.find((w) => w.id === report.warehouse_id);
            const totalOmzet = report.details?.reduce((acc, d) => acc + (d.subtotal || 0), 0) || 0;
            const totalTerjual = report.details?.reduce((acc, d) => acc + (d.terjual || 0), 0) || 0;

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-base text-slate-900">{report.nomor_laporan}</h3>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 inline" />
                          <span>{area?.nama_kota_kabupaten} ({area?.region})</span>
                          <span>&bull;</span>
                          <Calendar className="w-3.5 h-3.5 text-slate-400 inline" />
                          <span>{formatDateID(report.periode_mulai)} - {formatDateID(report.periode_selesai)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <button
                        onClick={() => setSelectedReportDetail(report)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail Laporan</span>
                      </button>
                      {report.status === 'Ditolak' && (
                        <button
                          onClick={() => onReviseReport(report)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revisi & Kirim Ulang</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection Alert Box */}
                  {report.status === 'Ditolak' && report.rejection_reason && (
                    <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-rose-900">Alasan Penolakan dari Admin:</strong>
                          <p className="mt-0.5">{report.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary row */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Brand Dilaporkan</span>
                      <strong className="text-slate-800">{report.details?.length || 0} Produk</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Terjual</span>
                      <strong className="text-emerald-700 font-bold">{totalTerjual} Pack</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Omzet</span>
                      <strong className="text-slate-900 font-bold">{formatRupiah(totalOmzet)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Pembayaran</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {report.pembayaran?.metode} ({formatRupiah(report.pembayaran?.nominal_transfer || 0)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-base">Detail Laporan {selectedReportDetail.nomor_laporan}</h3>
                  {getStatusBadge(selectedReportDetail.status)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dibuat pada {formatDateID(selectedReportDetail.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs border border-slate-200">
                <div>
                  <span className="text-slate-500">Area Distribusi:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {areas.find((a) => a.id === selectedReportDetail.area_id)?.nama_kota_kabupaten}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Gudang Sumber:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {warehouses.find((w) => w.id === selectedReportDetail.warehouse_id)?.nama_gudang}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Periode Distribusi:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {formatDateID(selectedReportDetail.periode_mulai)} - {formatDateID(selectedReportDetail.periode_selesai)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Sales PIC:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{currentUser.nama_lengkap}</p>
                </div>
              </div>

              {/* Detail Penjualan Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Detail Penjualan Per Brand
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Brand & SKU</th>
                        <th className="py-2.5 px-2 text-center">Stok Awal</th>
                        <th className="py-2.5 px-2 text-center text-emerald-800">Terjual</th>
                        <th className="py-2.5 px-2 text-center">Sample</th>
                        <th className="py-2.5 px-2 text-center">Titip</th>
                        <th className="py-2.5 px-2 text-center">Stok Akhir</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {selectedReportDetail.details?.map((d) => {
                        const brand = brands.find((b) => b.id === d.brand_id);
                        return (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-900 block">{brand?.brand_name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{brand?.sku_code}</span>
                            </td>
                            <td className="py-2 px-2 text-center font-mono">{d.stok_awal}</td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">
                              {d.terjual}
                            </td>
                            <td className="py-2 px-2 text-center font-mono">{d.sample_bonus}</td>
                            <td className="py-2 px-2 text-center font-mono">{d.titip_toko}</td>
                            <td className="py-2 px-2 text-center font-mono font-bold bg-slate-50">{d.stok_akhir}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRupiah(d.subtotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-bold text-xs">
                      <tr>
                        <td colSpan={6} className="py-2.5 px-3 text-right uppercase">Total Penjualan:</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">
                          {formatRupiah(
                            selectedReportDetail.details?.reduce((acc, d) => acc + (d.subtotal || 0), 0) || 0
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Bagian Pembayaran & Bukti */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Informasi Pembayaran
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-slate-500">Metode Pembayaran:</span>
                    <p className="font-bold capitalize text-slate-900 mt-0.5">{selectedReportDetail.pembayaran?.metode}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Nominal Transfer/Setoran:</span>
                    <p className="font-bold text-blue-800 mt-0.5">
                      {formatRupiah(selectedReportDetail.pembayaran?.nominal_transfer || 0)}
                    </p>
                  </div>
                  {selectedReportDetail.pembayaran?.bank_tujuan && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Bank Tujuan:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedReportDetail.pembayaran.bank_tujuan}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Tanggal Transaksi:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{formatDateID(selectedReportDetail.pembayaran?.tanggal_tf)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status Pembayaran:</span>
                    <p className="mt-0.5">{getStatusBadge(selectedReportDetail.pembayaran?.status || 'Menunggu Verifikasi')}</p>
                  </div>
                </div>

                {/* Bukti Transfer Image */}
                {selectedReportDetail.pembayaran?.bukti_transfer_url && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-1.5">Bukti Transfer Terlampir:</span>
                    <div className="relative rounded-lg overflow-hidden border border-slate-300 max-h-56 bg-slate-900 flex justify-center">
                      <img
                        src={selectedReportDetail.pembayaran.bukti_transfer_url}
                        alt="Bukti Transfer"
                        className="h-56 object-contain cursor-pointer hover:opacity-90 transition"
                        onClick={() => setZoomReceipt(true)}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 text-center">Klik gambar untuk melihat ukuran penuh</p>
                  </div>
                )}
              </div>

              {/* Catatan Tambahan */}
              {selectedReportDetail.catatan_tambahan && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                  <strong className="text-blue-900 block mb-0.5">Catatan Tambahan PIC:</strong>
                  <p className="text-slate-700">{selectedReportDetail.catatan_tambahan}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end space-x-2">
              {selectedReportDetail.status === 'Ditolak' && (
                <button
                  onClick={() => {
                    const rep = selectedReportDetail;
                    setSelectedReportDetail(null);
                    onReviseReport(rep);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  Revisi Sekarang
                </button>
              )}
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Zoom modal for receipt */}
      {zoomReceipt && selectedReportDetail?.pembayaran?.bukti_transfer_url && (
        <div
          onClick={() => setZoomReceipt(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 cursor-pointer"
        >
          <img
            src={selectedReportDetail.pembayaran.bukti_transfer_url}
            alt="Bukti Transfer Zoom"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
