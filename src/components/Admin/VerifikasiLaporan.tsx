import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Calendar,
  MapPin,
  CreditCard,
  X,
  Search,
  Check,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  RotateCcw,
  List,
  Sparkles,
} from 'lucide-react';
import { User, LaporanDistribusi, LaporanStatus } from '../../types';
import { store } from '../../db/store';
import { formatRupiah, formatDateID } from '../../utils/calc';
import { DAFTAR_KAB_KOTA_INDONESIA } from '../../data/indonesiaKabKota';

interface VerifikasiLaporanProps {
  currentUser: User;
}

export const VerifikasiLaporan: React.FC<VerifikasiLaporanProps> = ({ currentUser }) => {
  const db = store.getState();
  const laporanList = db.laporan;
  const users = db.users;
  const areas = db.areas;
  const brands = db.brands;
  const warehouses = db.warehouses;

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'Semua' | LaporanStatus>('Menunggu Verifikasi');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card_subsigawhs' | 'table_list'>('card_subsigawhs');

  // Currently inspected report ID
  const [selectedReportId, setSelectedReportId] = useState<string>(() => {
    // Default to the first pending report, or the first report in the list
    const pending = laporanList.find((l) => l.status === 'Menunggu Verifikasi');
    return pending ? pending.id : laporanList[0]?.id || '';
  });

  // Selected brand index inside the active report's details
  const [activeBrandIndex, setActiveBrandIndex] = useState<number>(0);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Approval confirmation modal
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);

  // Zoom receipt modal
  const [zoomReceipt, setZoomReceipt] = useState(false);

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered reports
  const filteredLaporan = laporanList.filter((l) => {
    const matchesStatus = statusFilter === 'Semua' || l.status === statusFilter;
    const pic = users.find((u) => u.id === l.pic_id);
    const area = areas.find((a) => a.id === l.area_id);

    const matchesSearch =
      l.nomor_laporan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pic?.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (area?.nama_kota_kabupaten || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.catatan_tambahan || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Keep selected report valid when filter changes
  useEffect(() => {
    if (filteredLaporan.length > 0) {
      const currentExists = filteredLaporan.some((l) => l.id === selectedReportId);
      if (!currentExists) {
        setSelectedReportId(filteredLaporan[0].id);
        setActiveBrandIndex(0);
      }
    }
  }, [statusFilter, searchTerm, filteredLaporan, selectedReportId]);

  const selectedReport = laporanList.find((l) => l.id === selectedReportId) || filteredLaporan[0] || null;

  // Reset active brand index when selected report changes
  useEffect(() => {
    setActiveBrandIndex(0);
  }, [selectedReportId]);

  const currentIndex = filteredLaporan.findIndex((l) => l.id === selectedReport?.id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedReportId(filteredLaporan[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredLaporan.length - 1) {
      setSelectedReportId(filteredLaporan[currentIndex + 1].id);
    }
  };

  const handleApprove = () => {
    if (!selectedReport) return;
    const res = store.verifyLaporan(selectedReport.id, currentUser.id, 'Diterima');
    if (res.success) {
      setApproveConfirmOpen(false);
      setToastMessage(`Laporan ${selectedReport.nomor_laporan} berhasil disetujui & diverifikasi.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleReject = () => {
    if (!selectedReport) return;
    if (!rejectionReason.trim()) {
      setRejectError('Admin wajib mengisi alasan penolakan agar PIC tahu apa yang perlu diperbaiki.');
      return;
    }

    const res = store.verifyLaporan(selectedReport.id, currentUser.id, 'Ditolak', rejectionReason);
    if (res.success) {
      setRejectModalOpen(false);
      setRejectionReason('');
      setRejectError(null);
      setToastMessage(`Laporan ${selectedReport.nomor_laporan} ditolak. Notifikasi telah dikirim ke PIC.`);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setRejectError(res.error || 'Gagal menolak laporan');
    }
  };

  // Helper info for selected report
  const pic = selectedReport ? users.find((u) => u.id === selectedReport.pic_id) : null;
  const area = selectedReport ? areas.find((a) => a.id === selectedReport.area_id) : null;
  const currentDetail = selectedReport?.details?.[activeBrandIndex] || selectedReport?.details?.[0];
  const activeBrand = currentDetail ? brands.find((b) => b.id === currentDetail.brand_id) : null;

  // Total sales calculation
  const totalOmzet = selectedReport?.details?.reduce((acc, d) => acc + (d.subtotal || 0), 0) || 0;
  const nominalTransfer = selectedReport?.pembayaran?.nominal_transfer || 0;
  const isMatch = Math.abs(totalOmzet - nominalTransfer) === 0;

  const getStatusBadge = (status: LaporanStatus) => {
    switch (status) {
      case 'Diterima':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Diterima
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Menunggu Verifikasi
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 font-sans">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & View Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Portal Admin
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Verifikasi Laporan Distribusi & Sales
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Periksa data penjualan PIC, teliti stok awal, titip toko, sample, terjual, dan cocokkan bukti transfer.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('card_subsigawhs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'card_subsigawhs'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Format Form Sub Siga</span>
            </button>
            <button
              onClick={() => setViewMode('table_list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'table_list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar Tabel</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['Menunggu Verifikasi', 'Diterima', 'Ditolak', 'Semua'] as Array<LaporanStatus | 'Semua'>).map((st) => {
              const count = st === 'Semua' ? laporanList.length : laporanList.filter((l) => l.status === st).length;
              const isActive = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{st}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor, PIC, atau kota..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredLaporan.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Laporan Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Semua laporan dengan status ini telah diverifikasi atau tidak cocok dengan kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Quick Report Selector Sidebar (Left 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Antrean Laporan ({filteredLaporan.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {currentIndex + 1} dari {filteredLaporan.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
              {filteredLaporan.map((rep, idx) => {
                const isSelected = rep.id === selectedReport?.id;
                const repPic = users.find((u) => u.id === rep.pic_id);
                const repArea = areas.find((a) => a.id === rep.area_id);
                const repTotal = rep.details?.reduce((acc, d) => acc + (d.subtotal || 0), 0) || 0;

                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setSelectedReportId(rep.id);
                      setActiveBrandIndex(0);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-blue-900">
                        {rep.nomor_laporan}
                      </span>
                      {getStatusBadge(rep.status)}
                    </div>

                    <div className="text-xs text-slate-800 font-semibold truncate">
                      {repPic?.nama_lengkap} &bull;{' '}
                      <span className="text-slate-500 font-normal">{repArea?.nama_kota_kabupaten}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>{formatDateID(rep.periode_selesai)}</span>
                      <strong className="text-slate-900 font-bold">{formatRupiah(repTotal)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification View matching https://subsigawhs.blogspot.com/ (Right 8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Navigation Header for single card */}
            <div className="w-full max-w-md flex items-center justify-between mb-3 text-xs text-slate-500 px-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              <span className="font-medium">
                Memeriksa Laporan <strong className="text-slate-800">{currentIndex + 1}</strong> dari{' '}
                <strong className="text-slate-800">{filteredLaporan.length}</strong>
              </span>

              <button
                onClick={handleNext}
                disabled={currentIndex === filteredLaporan.length - 1}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition flex items-center space-x-1"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* THE SUBSIGA CARD (1:1 Layout & Colors of https://subsigawhs.blogspot.com/) */}
            {selectedReport && (
              <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden p-6 border border-gray-200 transition-all">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-mono font-bold rounded">
                      {selectedReport.nomor_laporan}
                    </span>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Laporan Distribusi & Sales</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Verifikasi data penjualan dan bukti pembayaran di bawah ini
                  </p>
                </div>

                {/* FORM CONTAINER */}
                <div>
                  {/* SECTION 1: INFORMASI UTAMA */}
                  <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-gray-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-1">
                      ℹ️ Informasi Area & PIC
                    </h3>

                    {/* Area */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Area (Ketik nama Kota/Kab...)
                      </label>
                      <input
                        className="w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        list="daftar_kota_admin"
                        name="area"
                        readOnly
                        value={area?.nama_kota_kabupaten || 'Boyolali'}
                      />
                      <datalist id="daftar_kota_admin">
                        {DAFTAR_KAB_KOTA_INDONESIA.slice(0, 50).map((kota) => (
                          <option key={kota} value={kota} />
                        ))}
                      </datalist>
                    </div>

                    {/* PIC */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">PIC</label>
                      <input
                        className="w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        name="pic"
                        readOnly
                        value={pic?.nama_lengkap || 'Sales PIC'}
                      />
                    </div>

                    {/* Periode Mulai & Selesai */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Periode Mulai</label>
                        <input
                          className="w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          name="periode_mulai"
                          readOnly
                          type="date"
                          value={selectedReport.periode_mulai || ''}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Periode Selesai</label>
                        <input
                          className="w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          name="periode_selesai"
                          readOnly
                          type="date"
                          value={selectedReport.periode_selesai || ''}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: DATA PENJUALAN BRAND */}
                  <div className="bg-orange-50/50 p-4 rounded-lg mb-4 border border-orange-100">
                    <div className="flex items-center justify-between mb-3 border-b border-orange-100 pb-1">
                      <h3 className="text-sm font-bold text-orange-700">
                        📦 Data Penjualan Brand
                      </h3>
                      {selectedReport.details && selectedReport.details.length > 1 && (
                        <span className="text-[10px] text-orange-800 font-bold bg-orange-100 px-2 py-0.5 rounded">
                          Produk {activeBrandIndex + 1} dari {selectedReport.details.length}
                        </span>
                      )}
                    </div>

                    {/* DROPDOWN PILIHAN BRAND */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Pilih Brand</label>
                      {selectedReport.details && selectedReport.details.length > 1 ? (
                        <select
                          className="w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-700 font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none"
                          value={activeBrandIndex}
                          onChange={(e) => setActiveBrandIndex(Number(e.target.value))}
                        >
                          {selectedReport.details.map((d, i) => {
                            const b = brands.find((brand) => brand.id === d.brand_id);
                            return (
                              <option key={d.id} value={i}>
                                {b?.brand_name || `Produk ${i + 1}`} (Terjual: {d.terjual})
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <select
                          className="w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-700 font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none"
                          name="nama_brand"
                          disabled
                          value={activeBrand?.brand_name || 'Otentik 12'}
                        >
                          <option value="Otentik 12">Otentik 12</option>
                          <option value="Otentik 16">Otentik 16</option>
                          <option value="Mag. Blewah 12">Mag. Blewah 12</option>
                          <option value="Mag. Blewah 16">Mag. Blewah 16</option>
                          {brands.map((b) => (
                            <option key={b.id} value={b.brand_name}>
                              {b.brand_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Grid Stok Awal & Titip Toko */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Stok Awal (Pack)</label>
                        <input
                          className="w-full px-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white text-gray-800 font-medium"
                          id="stok_awal"
                          name="stok_awal"
                          readOnly
                          value={currentDetail?.stok_awal ?? 0}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Titip Toko (Pack)</label>
                        <input
                          className="w-full px-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white text-gray-800 font-medium"
                          id="titip"
                          name="titip"
                          readOnly
                          value={currentDetail?.titip_toko ?? 0}
                        />
                      </div>
                    </div>

                    {/* Grid Sample, Terjual, Stok Akhir */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Sample/Bonus</label>
                        <input
                          className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white text-gray-800 font-medium"
                          id="sample"
                          name="sample"
                          readOnly
                          value={currentDetail?.sample_bonus ?? 0}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Terjual</label>
                        <input
                          className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white text-gray-800 font-bold"
                          id="terjual"
                          name="terjual"
                          readOnly
                          value={currentDetail?.terjual ?? 0}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 font-bold mb-1">Stok Akhir</label>
                        <input
                          className="w-full px-2 py-1.5 border rounded-md text-sm bg-orange-100 font-bold text-orange-800 focus:outline-none"
                          id="stok_akhir"
                          name="stok_akhir"
                          readOnly
                          value={currentDetail?.stok_akhir ?? 0}
                        />
                      </div>
                    </div>

                    {/* Calculation Subtotal info */}
                    <div className="mt-2.5 pt-2 border-t border-orange-100 flex items-center justify-between text-xs text-orange-950 font-medium">
                      <span>Subtotal Nilai Penjualan:</span>
                      <strong className="font-bold text-orange-800 text-sm">
                        {formatRupiah(currentDetail?.subtotal || 0)}
                      </strong>
                    </div>
                  </div>

                  {/* SECTION 3: PAYMENT */}
                  <div className="bg-emerald-50/60 p-4 rounded-lg mb-5 border border-emerald-100">
                    <h3 className="text-sm font-semibold text-emerald-800 mb-3 border-b border-emerald-100 pb-1">
                      💳 Rincian Pembayaran (Payment)
                    </h3>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nominal Transfer (Rp)
                        </label>
                        <input
                          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-gray-800 font-bold"
                          name="nominal_transfer"
                          readOnly
                          value={selectedReport.pembayaran?.nominal_transfer || ''}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal TF</label>
                        <input
                          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-gray-800"
                          name="tanggal_transfer"
                          readOnly
                          type="date"
                          value={selectedReport.pembayaran?.tanggal_tf || selectedReport.periode_selesai}
                        />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded border border-emerald-100/70">
                      <label className="block text-xs font-bold text-emerald-800 mb-2">
                        Keterangan Tambahan:
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-gray-700"
                        name="keterangan"
                        readOnly
                        rows={2}
                        value={
                          selectedReport.catatan_tambahan ||
                          'Tidak ada catatan tambahan yang dilampirkan oleh PIC.'
                        }
                      />
                    </div>

                    {/* Reconciliation audit check */}
                    <div className="mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Kesesuaian Total Omzet:</span>
                      {isMatch ? (
                        <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Cocok 100% ({formatRupiah(totalOmzet)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Selisih {formatRupiah(Math.abs(totalOmzet - nominalTransfer))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SECTION 4: UPLOAD BUKTI TRANSFER (DENGAN PILIHAN) */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      📸 Bukti Transfer
                    </label>

                    {/* Dua Tombol Pilihan (Preserved from blogspot design) */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex flex-col items-center justify-center py-2.5 border border-blue-200 bg-blue-50/50 text-blue-700 rounded-lg text-center opacity-90">
                        <Camera className="w-5 h-5 mb-1 text-blue-600" />
                        <span className="text-[11px] font-bold">Ambil Foto</span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-2.5 border border-emerald-200 bg-emerald-50/50 text-emerald-700 rounded-lg text-center opacity-90">
                        <ImageIcon className="w-5 h-5 mb-1 text-emerald-600" />
                        <span className="text-[11px] font-bold">Buka Galeri</span>
                      </div>
                    </div>

                    {/* Area Preview Gambar */}
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                      <p className="text-[10px] text-gray-500 mb-2 font-medium" id="sumber_text">
                        Foto berhasil dimuat &bull; Sumber: Bukti Transfer PIC Lapangan
                      </p>

                      {selectedReport.pembayaran?.bukti_transfer_url ? (
                        <div className="relative group cursor-pointer" onClick={() => setZoomReceipt(true)}>
                          <img
                            src={selectedReport.pembayaran.bukti_transfer_url}
                            alt="Preview Bukti Transfer"
                            className="max-h-52 rounded shadow-sm border border-slate-200 object-contain hover:opacity-95 transition"
                          />
                          <div className="absolute inset-0 bg-black/30 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                            <ZoomIn className="w-4 h-4 mr-1" />
                            Klik untuk Perbesar
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-1 text-amber-400" />
                          Tidak ada foto bukti transfer yang dilampirkan
                        </div>
                      )}

                      {selectedReport.pembayaran?.bukti_transfer_url && (
                        <button
                          type="button"
                          onClick={() => setZoomReceipt(true)}
                          className="mt-3 px-3 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-300 transition flex items-center space-x-1"
                        >
                          <ZoomIn className="w-3 h-3 mr-1" />
                          <span>Periksa Bukti Ukuran Penuh</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SECTION 5: ADMIN VERIFICATION ACTIONS */}
                  <div className="pt-2 border-t border-slate-100">
                    {selectedReport.status === 'Menunggu Verifikasi' ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setApproveConfirmOpen(true)}
                          className="w-full bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-md text-sm hover:bg-emerald-700 transition shadow-sm flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Setujui & Verifikasi Laporan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectError(null);
                            setRejectModalOpen(true);
                          }}
                          className="w-full bg-rose-600 text-white font-semibold py-2 px-4 rounded-md text-xs hover:bg-rose-700 transition shadow-sm flex items-center justify-center space-x-2"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak Laporan (Minta Revisi PIC)</span>
                        </button>
                      </div>
                    ) : selectedReport.status === 'Diterima' ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center space-x-1 text-emerald-800 text-xs font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Laporan Telah Diverifikasi & Diterima</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 mt-0.5">
                          Stok gudang telah diperbarui dan transaksi masuk ke rekap keuangan.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-left">
                        <div className="flex items-center space-x-1 text-rose-800 text-xs font-bold mb-1">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Laporan Ditolak</span>
                        </div>
                        <p className="text-xs text-rose-700">
                          <strong>Alasan:</strong> {selectedReport.rejection_reason || 'Revisi diminta oleh admin.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABLE LIST VIEW (Optional tab) */}
      {viewMode === 'table_list' && (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Daftar Seluruh Laporan Distribusi</h3>
            <span className="text-xs text-slate-500">Klik 'Periksa' untuk memuat ke kartu verifikasi</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">No. Laporan</th>
                  <th className="py-3 px-4">Sales PIC</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-3 text-center">Periode</th>
                  <th className="py-3 px-4 text-right">Total Tagihan</th>
                  <th className="py-3 px-4 text-center">Transfer</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredLaporan.map((rep) => {
                  const repPic = users.find((u) => u.id === rep.pic_id);
                  const repArea = areas.find((a) => a.id === rep.area_id);
                  const repTotal = rep.details?.reduce((acc, d) => acc + (d.subtotal || 0), 0) || 0;

                  return (
                    <tr
                      key={rep.id}
                      className={`hover:bg-blue-50/50 transition ${
                        rep.id === selectedReport?.id ? 'bg-blue-50/80 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {rep.nomor_laporan}
                      </td>
                      <td className="py-3 px-4">{repPic?.nama_lengkap}</td>
                      <td className="py-3 px-4">{repArea?.nama_kota_kabupaten}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {formatDateID(rep.periode_mulai)} - {formatDateID(rep.periode_selesai)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(repTotal)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {formatRupiah(rep.pembayaran?.nominal_transfer || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(rep.status)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedReportId(rep.id);
                            setViewMode('card_subsigawhs');
                          }}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs"
                        >
                          Periksa di Kartu
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {approveConfirmOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center">
              Konfirmasi Persetujuan Laporan
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Anda akan memverifikasi dan menyetujui laporan{' '}
              <strong className="text-slate-900">{selectedReport.nomor_laporan}</strong> oleh{' '}
              <strong className="text-slate-900">{pic?.nama_lengkap}</strong>.
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Penjualan:</span>
                <strong className="text-slate-900">{formatRupiah(totalOmzet)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal Transfer:</span>
                <strong className="text-emerald-700">
                  {formatRupiah(selectedReport.pembayaran?.nominal_transfer || 0)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pengurangan Stok:</span>
                <strong className="text-slate-900">
                  {selectedReport.details?.reduce((acc, d) => acc + d.terjual + d.sample_bonus, 0)} Pack
                </strong>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setApproveConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition"
              >
                Ya, Setujui Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center">
              Tolak Laporan {selectedReport.nomor_laporan}
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              PIC <strong className="text-slate-900">{pic?.nama_lengkap}</strong> akan menerima notifikasi
              dan wajib merevisi laporan ini.
            </p>

            <div className="mt-4 mb-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Penolakan / Catatan Perbaikan <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectError(null);
                }}
                placeholder="Contoh: Bukti transfer tidak jelas/terpotong, atau nominal transfer selisih Rp 200.000 dengan total tagihan..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none"
                rows={3}
              />
              {rejectError && <p className="text-xs text-rose-600 mt-1 font-semibold">{rejectError}</p>}
            </div>

            {/* Quick reason presets */}
            <div className="mb-4">
              <span className="text-[11px] text-slate-400 block mb-1 font-medium">Pilihan cepat:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Bukti transfer buram/tidak terbaca',
                  'Nominal transfer tidak sesuai total omzet',
                  'Salah hitung stok titip atau sample',
                  'Periode laporan salah/duplikat',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md transition"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ZOOM RECEIPT MODAL */}
      {zoomReceipt && selectedReport?.pembayaran?.bukti_transfer_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4"
          onClick={() => setZoomReceipt(false)}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
              <span className="font-bold">
                Bukti Transfer: {selectedReport.nomor_laporan} ({pic?.nama_lengkap})
              </span>
              <button
                onClick={() => setZoomReceipt(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={selectedReport.pembayaran.bukti_transfer_url}
                alt="Bukti Transfer Penuh"
                className="max-h-[75vh] w-auto rounded shadow-md object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VerifikasiLaporan;
