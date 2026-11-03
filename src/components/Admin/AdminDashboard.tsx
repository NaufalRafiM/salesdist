import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Boxes,
  Users,
  TrendingUp,
  MapPin,
  Package,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Download,
  Filter,
  Eye,
  CreditCard,
  Building2,
  Calendar,
  Check,
  X,
  ZoomIn,
  RefreshCw,
  PlusCircle,
  Activity,
} from 'lucide-react';
import { User, LaporanDistribusi, LaporanStatus } from '../../types';
import { store } from '../../db/store';
import {
  formatRupiah,
  formatDateID,
  formatDateTimeID,
  filterReportsByRange,
  TimeRangeFilter,
} from '../../utils/calc';

interface AdminDashboardProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigate }) => {
  const db = store.getState();
  const laporanList = db.laporan;
  const users = db.users;
  const brands = db.brands;
  const areas = db.areas;
  const warehouses = db.warehouses;
  const stokGudang = db.stok_gudang;

  // Filter state for analytics
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');

  // Direct modal inspection state from dashboard
  const [inspectReport, setInspectReport] = useState<LaporanDistribusi | null>(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [zoomReceipt, setZoomReceipt] = useState(false);

  // Toast confirmation feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Filtered reports for analytics based on selected range and area
  const filteredReports = useMemo(() => {
    return filterReportsByRange(laporanList, timeRange, selectedAreaId);
  }, [laporanList, timeRange, selectedAreaId]);

  // Overall metrics
  const pendingReports = laporanList.filter((l) => l.status === 'Menunggu Verifikasi');
  const acceptedReports = filteredReports.filter((l) => l.status === 'Diterima');
  const rejectedReports = filteredReports.filter((l) => l.status === 'Ditolak');

  const pendingPics = users.filter((u) => u.role === 'pic' && u.status_verifikasi === 'pending');
  const verifiedPics = users.filter((u) => u.role === 'pic' && u.status_verifikasi === 'terverifikasi');
  const lowStockItems = stokGudang.filter((s) => s.current_stock <= 50);

  // Financial calculations
  const totalOmzetTerverifikasi = acceptedReports.reduce((acc, l) => {
    return acc + (l.details?.reduce((sum, d) => sum + (d.subtotal || 0), 0) || 0);
  }, 0);

  const totalVolumeTerjual = acceptedReports.reduce((acc, l) => {
    return acc + (l.details?.reduce((sum, d) => sum + (d.terjual || 0), 0) || 0);
  }, 0);

  const avgOmzetPerLaporan = acceptedReports.length > 0 ? totalOmzetTerverifikasi / acceptedReports.length : 0;

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const breakdown = {
      'bank transfer': { count: 0, nominal: 0 },
      QRIS: { count: 0, nominal: 0 },
      tunai: { count: 0, nominal: 0 },
    };

    acceptedReports.forEach((l) => {
      const totalLap = l.details?.reduce((sum, d) => sum + (d.subtotal || 0), 0) || 0;
      const metode = l.pembayaran?.metode || 'tunai';
      if (breakdown[metode]) {
        breakdown[metode].count += 1;
        breakdown[metode].nominal += totalLap;
      }
    });

    return breakdown;
  }, [acceptedReports]);

  // Sales per Brand calculations
  const brandSalesList = useMemo(() => {
    const map: Record<string, { brand_name: string; sku: string; category: string; base_price: number; terjual: number; omzet: number }> = {};
    brands.forEach((b) => {
      map[b.id] = {
        brand_name: b.brand_name,
        sku: b.sku_code,
        category: b.category,
        base_price: b.base_price,
        terjual: 0,
        omzet: 0,
      };
    });

    acceptedReports.forEach((l) => {
      l.details?.forEach((d) => {
        if (map[d.brand_id]) {
          map[d.brand_id].terjual += d.terjual;
          map[d.brand_id].omzet += d.subtotal;
        }
      });
    });

    return Object.values(map).sort((a, b) => b.omzet - a.omzet);
  }, [brands, acceptedReports]);

  const maxBrandOmzet = Math.max(...brandSalesList.map((b) => b.omzet), 1);

  // Sales per Area calculations
  const areaSalesList = useMemo(() => {
    const map: Record<string, { id: string; nama_area: string; region: string; omzet: number; count: number; volume: number }> = {};
    areas.forEach((a) => {
      map[a.id] = {
        id: a.id,
        nama_area: a.nama_kota_kabupaten,
        region: a.region,
        omzet: 0,
        count: 0,
        volume: 0,
      };
    });

    acceptedReports.forEach((l) => {
      const totalLap = l.details?.reduce((sum, d) => sum + (d.subtotal || 0), 0) || 0;
      const vol = l.details?.reduce((sum, d) => sum + (d.terjual || 0), 0) || 0;
      if (map[l.area_id]) {
        map[l.area_id].omzet += totalLap;
        map[l.area_id].count += 1;
        map[l.area_id].volume += vol;
      }
    });

    return Object.values(map).sort((a, b) => b.omzet - a.omzet);
  }, [areas, acceptedReports]);

  const maxAreaOmzet = Math.max(...areaSalesList.map((a) => a.omzet), 1);

  // Direct PIC Approval/Rejection
  const handleVerifyPIC = (picId: string, status: 'terverifikasi' | 'ditolak') => {
    const pic = users.find((u) => u.id === picId);
    if (!pic) return;
    store.updateUser(picId, { status_verifikasi: status });
    showToast(
      status === 'terverifikasi'
        ? `Akun PIC ${pic.nama_lengkap} berhasil disetujui!`
        : `Akun PIC ${pic.nama_lengkap} ditolak.`
    );
  };

  // Direct Report Approval from dashboard
  const handleApproveReport = () => {
    if (!inspectReport) return;
    const res = store.verifyLaporan(inspectReport.id, currentUser.id, 'Diterima');
    if (res.success) {
      setApproveConfirmOpen(false);
      setInspectReport(null);
      showToast(`Laporan ${inspectReport.nomor_laporan} berhasil disetujui! Stok gudang telah dipotong.`);
    }
  };

  // Direct Report Rejection from dashboard
  const handleRejectReport = () => {
    if (!inspectReport) return;
    if (!rejectionReason.trim()) {
      setRejectError('Admin wajib mengisi alasan penolakan.');
      return;
    }

    const res = store.verifyLaporan(inspectReport.id, currentUser.id, 'Ditolak', rejectionReason);
    if (res.success) {
      setRejectModalOpen(false);
      setRejectionReason('');
      setInspectReport(null);
      showToast(`Laporan ${inspectReport.nomor_laporan} ditolak dengan alasan revisi.`);
    } else {
      setRejectError(res.error || 'Gagal menolak laporan');
    }
  };

  // Export CSV directly from dashboard
  const handleExportCSV = () => {
    const headers = [
      'Nomor Laporan',
      'Tanggal Input',
      'Sales PIC',
      'Area',
      'Periode Mulai',
      'Periode Selesai',
      'Total Omzet (Rp)',
      'Metode Bayar',
      'Bank Tujuan',
      'Status',
    ];

    const rows = filteredReports.map((l) => {
      const pic = users.find((u) => u.id === l.pic_id);
      const area = areas.find((a) => a.id === l.area_id);
      const totalOmzet = l.details?.reduce((acc, d) => acc + (d.subtotal || 0), 0) || 0;

      return [
        l.nomor_laporan,
        formatDateID(l.created_at),
        pic?.nama_lengkap || '-',
        area?.nama_kota_kabupaten || '-',
        l.periode_mulai,
        l.periode_selesai,
        totalOmzet,
        l.pembayaran?.metode || '-',
        l.pembayaran?.bank_tujuan || '-',
        l.status,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SALESDIST_Admin_Rekap_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Berkas CSV Rekap Distribusi berhasil diunduh!');
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-500/40 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Top Hero Command Center Header */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-blue-900/40 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Command Center</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">
              &bull; {todayFormatted}
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistem Operasional Sinkron</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Dashboard Pengawasan & Verifikasi Penjualan
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
            Pantau arus distribusi {brands.length} brand produk di {areas.length} wilayah operasional, 
            verifikasi laporan sales PIC, dan kelola ketersediaan stok fisik di {warehouses.length} gudang utama.
          </p>
        </div>

        {/* Quick Action Buttons on Hero */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <button
            onClick={() => onNavigate('admin_verifikasi')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 transition flex items-center space-x-2"
          >
            <Clock className="w-4 h-4 text-blue-200" />
            <span>Verifikasi Laporan ({pendingReports.length})</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center space-x-1.5"
            title="Download Rekap CSV"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Filter Data Analitik:
          </span>
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'week', label: '7 Hari Terakhir' },
              { id: 'today', label: 'Hari Ini' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as TimeRangeFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  timeRange === t.id
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Wilayah:</span>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Wilayah ({areas.length} Area)</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama_kota_kabupaten} ({a.region})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setTimeRange('all');
              setSelectedAreaId('all');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Reset Filter"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omzet Terverifikasi */}
        <div
          onClick={() => onNavigate('admin_rekap')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Omzet Terverifikasi</span>
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 truncate">{formatRupiah(totalOmzetTerverifikasi)}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-emerald-700 font-semibold">{acceptedReports.length} laporan disetujui</span>
            <span className="text-slate-400">Rerata: {formatRupiah(avgOmzetPerLaporan)}</span>
          </div>
        </div>

        {/* Card 2: Menunggu Verifikasi */}
        <div
          onClick={() => onNavigate('admin_verifikasi')}
          className="bg-white rounded-2xl p-5 border border-amber-300 bg-amber-50/20 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Perlu Verifikasi</span>
            <span className="p-2.5 rounded-xl bg-amber-100 text-amber-800 animate-pulse">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black text-amber-950 mt-2">{pendingReports.length}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/60 text-[11px]">
            <span className="text-amber-800 font-semibold">Menunggu review Admin</span>
            <span className="text-blue-700 font-bold group-hover:underline flex items-center">
              Periksa &rarr;
            </span>
          </div>
        </div>

        {/* Card 3: Volume Terjual */}
        <div
          onClick={() => onNavigate('admin_rekap')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volume Terjual</span>
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Package className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {totalVolumeTerjual} <span className="text-sm font-semibold text-slate-500">pack</span>
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-blue-700 font-semibold">{brands.length} varian SKU</span>
            <span className="text-slate-400">Total terdistribusi</span>
          </div>
        </div>

        {/* Card 4: Stok Kritis Gudang */}
        <div
          onClick={() => onNavigate('admin_stok')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peringatan Stok</span>
            <span className={`p-2.5 rounded-xl ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <Boxes className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {lowStockItems.length}{' '}
            <span className="text-sm font-semibold text-slate-500">SKU menipis</span>
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className={lowStockItems.length > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
              {lowStockItems.length > 0 ? 'Perlu Restock Segera' : 'Semua Stok Aman'}
            </span>
            <span className="text-blue-700 font-semibold">Cek Gudang &rarr;</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Sales per Brand + Sales per Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Penjualan per Brand Produk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Performa Penjualan Brand Produk</h3>
                  <p className="text-[11px] text-slate-400">Peringkat kontribusi omzet & volume pack terjual</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {brands.length} SKU
              </span>
            </div>

            <div className="space-y-4">
              {brandSalesList.map((item, idx) => {
                const percentage = Math.round((item.omzet / maxBrandOmzet) * 100);

                return (
                  <div key={item.sku} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 ring-1 ring-amber-500'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-900'
                            : idx === 2
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">{item.brand_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({item.sku})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-blue-900 text-xs block">{formatRupiah(item.omzet)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-blue-600' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.max(percentage, item.omzet > 0 ? 5 : 0)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Terjual: <strong className="text-slate-800">{item.terjual} pack</strong> ({formatRupiah(item.base_price)}/pack)</span>
                      <span>{percentage}% dari produk tertinggi</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Diperbarui dari transaksi terverifikasi</span>
            <button
              onClick={() => onNavigate('admin_master')}
              className="text-blue-600 font-bold hover:underline"
            >
              Kelola Master Brand &rarr;
            </button>
          </div>
        </div>

        {/* Chart 2: Penjualan per Wilayah / Area Operasional */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Distribusi Penjualan per Wilayah / Area</h3>
                  <p className="text-[11px] text-slate-400">Serapan pasar dan produktivitas kota distribusi</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {areas.length} Area
              </span>
            </div>

            <div className="space-y-4">
              {areaSalesList.map((item, idx) => {
                const percentage = Math.round((item.omzet / maxAreaOmzet) * 100);

                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{item.nama_area}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {item.region}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-800 text-xs block">{formatRupiah(item.omzet)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, item.omzet > 0 ? 5 : 0)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>{item.count} Laporan Disetujui &bull; {item.volume} pack</span>
                      <span>{percentage}% kontribusi regional</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Breakdown Widget */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Komposisi Metode Pembayaran</span>
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60">
                <span className="text-[10px] text-blue-700 font-bold block uppercase">Bank Transfer</span>
                <strong className="text-slate-900 block text-xs mt-0.5">{formatRupiah(paymentBreakdown['bank transfer'].nominal)}</strong>
                <span className="text-[10px] text-slate-500">{paymentBreakdown['bank transfer'].count} transaksi</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/60">
                <span className="text-[10px] text-purple-700 font-bold block uppercase">QRIS</span>
                <strong className="text-slate-900 block text-xs mt-0.5">{formatRupiah(paymentBreakdown['QRIS'].nominal)}</strong>
                <span className="text-[10px] text-slate-500">{paymentBreakdown['QRIS'].count} transaksi</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">Tunai</span>
                <strong className="text-slate-900 block text-xs mt-0.5">{formatRupiah(paymentBreakdown['tunai'].nominal)}</strong>
                <span className="text-[10px] text-slate-500">{paymentBreakdown['tunai'].count} transaksi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Table: Antrian Laporan Menunggu Verifikasi (dengan Quick Preview) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Antrian Laporan Menunggu Verifikasi ({pendingReports.length})
              </h3>
              <p className="text-xs text-slate-500">
                Periksa kesesuaian laporan penjualan dan bukti transfer dari sales PIC lapangan.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin_verifikasi')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>Halaman Verifikasi Penuh</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingReports.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2.5" />
            <p className="font-extrabold text-slate-800 text-sm">Semua Laporan Telah Diverifikasi!</p>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada antrian laporan tertunda. Semua pembayaran sales lapangan telah terekonsiliasi ke dalam sistem.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. Laporan</th>
                  <th className="py-3 px-4">Sales PIC</th>
                  <th className="py-3 px-4">Area & Periode</th>
                  <th className="py-3 px-4 text-right">Total Tagihan</th>
                  <th className="py-3 px-4 text-center">Pembayaran</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {pendingReports.map((rep) => {
                  const pic = users.find((u) => u.id === rep.pic_id);
                  const area = areas.find((a) => a.id === rep.area_id);
                  const totalOmzet = rep.details?.reduce((acc, d) => acc + (d.subtotal || 0), 0) || 0;

                  return (
                    <tr key={rep.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {rep.nomor_laporan}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {formatDateID(rep.created_at)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                            {pic?.nama_lengkap.charAt(0) || 'P'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{pic?.nama_lengkap}</span>
                            <span className="text-[10px] text-slate-500">WA: {pic?.no_whatsapp}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{area?.nama_kota_kabupaten}</span>
                        <span className="text-[10px] text-slate-500">
                          {formatDateID(rep.periode_mulai)} - {formatDateID(rep.periode_selesai)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-xs">
                        {formatRupiah(totalOmzet)}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {rep.details?.length} Brand
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase block mb-0.5">
                          {rep.pembayaran?.metode}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatRupiah(rep.pembayaran?.nominal_transfer || 0)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setInspectReport(rep)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Periksa & Verifikasi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two Columns: Pendaftaran PIC Baru & Pemantauan Stok Gudang */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Pendaftaran PIC Baru */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Persetujuan Registrasi Sales PIC ({pendingPics.length})
                  </h4>
                  <p className="text-[11px] text-slate-400">Verifikasi akun sales lapangan baru sebelum bisa login</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('admin_master')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Kelola Semua
              </button>
            </div>

            {pendingPics.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-600">Tidak ada pendaftaran PIC yang menunggu.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Total {verifiedPics.length} PIC telah terverifikasi dan aktif di lapangan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPics.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-slate-900 font-bold">{p.nama_lengkap}</strong>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {p.email} &bull; WA: {p.no_whatsapp}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 self-end sm:self-center">
                      <button
                        onClick={() => handleVerifyPIC(p.id, 'ditolak')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleVerifyPIC(p.id, 'terverifikasi')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui Akun</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{verifiedPics.length} PIC Terverifikasi</span>
            <span className="font-semibold text-slate-700">Total Akun: {users.length}</span>
          </div>
        </div>

        {/* Card 2: Pemantauan Stok Kritis Gudang */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Status Ketersediaan Stok Gudang ({lowStockItems.length})
                  </h4>
                  <p className="text-[11px] text-slate-400">Peringatan ketersediaan barang di gudang operasional</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('admin_stok')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Buka Gudang &rarr;
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">Seluruh stok barang di semua gudang aman!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada SKU di bawah batas minimum 50 pack.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.map((stk) => {
                  const brand = brands.find((b) => b.id === stk.brand_id);
                  const wh = warehouses.find((w) => w.id === stk.warehouse_id);

                  return (
                    <div
                      key={stk.id}
                      className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{brand?.brand_name}</span>
                        <span className="text-[11px] text-slate-500">
                          {wh?.nama_gudang} &bull; SKU: {brand?.sku_code}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-xs block">
                          Sisa: {stk.current_stock} pack
                        </span>
                        <span className="text-[10px] text-rose-800 font-semibold mt-0.5 block">
                          {stk.current_stock === 0 ? 'HABIS' : 'MENIPIS'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pantau secara real-time</span>
            <button
              onClick={() => onNavigate('admin_stok')}
              className="text-blue-600 font-bold hover:underline"
            >
              Tambah / Restock Stok &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* QUICK INSPECTION MODAL DIRECTLY ON DASHBOARD */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base">Verifikasi Laporan {inspectReport.nomor_laporan}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                      Menunggu Verifikasi
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Diajukan oleh {users.find((u) => u.id === inspectReport.pic_id)?.nama_lengkap} &bull;{' '}
                    {formatDateID(inspectReport.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Sales PIC:</span>
                  <strong className="text-slate-900">{users.find((u) => u.id === inspectReport.pic_id)?.nama_lengkap}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Area:</span>
                  <strong className="text-slate-900">{areas.find((a) => a.id === inspectReport.area_id)?.nama_kota_kabupaten}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Gudang Potong:</span>
                  <strong className="text-slate-900">{warehouses.find((w) => w.id === inspectReport.warehouse_id)?.nama_gudang}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Periode:</span>
                  <strong className="text-slate-900">
                    {formatDateID(inspectReport.periode_mulai)} - {formatDateID(inspectReport.periode_selesai)}
                  </strong>
                </div>
              </div>

              {/* Detail Penjualan Table */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
                  Rincian Penjualan & Perhitungan Stok
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2 px-3">Brand & SKU</th>
                        <th className="py-2 px-2 text-center">Stok Awal</th>
                        <th className="py-2 px-2 text-center text-emerald-800 bg-emerald-50">Terjual</th>
                        <th className="py-2 px-2 text-center">Sample</th>
                        <th className="py-2 px-2 text-center">Titip</th>
                        <th className="py-2 px-2 text-center bg-slate-200 font-bold">Stok Akhir</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectReport.details?.map((d) => {
                        const brand = brands.find((b) => b.id === d.brand_id);
                        return (
                          <tr key={d.id}>
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {brand?.brand_name}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {brand?.sku_code} &bull; {formatRupiah(d.base_price)}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center font-mono">{d.stok_awal}</td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/60">
                              {d.terjual}
                            </td>
                            <td className="py-2 px-2 text-center font-mono">{d.sample_bonus}</td>
                            <td className="py-2 px-2 text-center font-mono">{d.titip_toko}</td>
                            <td className="py-2 px-2 text-center font-mono font-bold bg-slate-100">
                              {d.stok_akhir}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {formatRupiah(d.subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-bold text-xs">
                      <tr>
                        <td colSpan={6} className="py-2 px-3 text-right uppercase">
                          Total Nilai Penjualan:
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400">
                          {formatRupiah(
                            inspectReport.details?.reduce((acc, d) => acc + (d.subtotal || 0), 0) || 0
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Rincian Bukti Transfer & Pembayaran */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 block uppercase">Informasi Pembayaran:</span>
                  <div>
                    <span className="text-slate-500">Metode: </span>
                    <strong className="text-slate-900 uppercase">{inspectReport.pembayaran?.metode}</strong>
                  </div>
                  {inspectReport.pembayaran?.bank_tujuan && (
                    <div>
                      <span className="text-slate-500">Bank Tujuan: </span>
                      <strong className="text-slate-900">{inspectReport.pembayaran.bank_tujuan}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Nominal Transfer: </span>
                    <strong className="text-blue-900 text-sm font-black">
                      {formatRupiah(inspectReport.pembayaran?.nominal_transfer || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tanggal Transaksi: </span>
                    <span className="text-slate-800 font-semibold">
                      {formatDateID(inspectReport.pembayaran?.tanggal_tf)}
                    </span>
                  </div>
                  {inspectReport.catatan_tambahan && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-slate-800">
                      <span className="font-bold text-blue-900 block text-[10px]">Catatan PIC:</span>
                      <p className="text-[11px]">{inspectReport.catatan_tambahan}</p>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-600 block uppercase mb-1">
                    Lampiran Bukti Transfer:
                  </span>
                  {inspectReport.pembayaran?.bukti_transfer_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-900 group">
                      <img
                        src={inspectReport.pembayaran.bukti_transfer_url}
                        alt="Bukti Transfer"
                        className="w-full h-36 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setZoomReceipt(true)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold space-x-1"
                      >
                        <ZoomIn className="w-4 h-4" />
                        <span>Klik Perbesar</span>
                      </button>
                    </div>
                  ) : (
                    <div className="h-36 border border-slate-200 rounded-xl bg-white flex items-center justify-center text-slate-400 text-xs text-center p-2">
                      Tidak ada gambar transfer (Metode Tunai / QRIS)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Menyetujui akan memotong stok gudang <strong>{warehouses.find((w) => w.id === inspectReport.warehouse_id)?.nama_gudang}</strong> secara otomatis.
              </span>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak Laporan</span>
                </button>
                <button
                  onClick={() => setApproveConfirmOpen(true)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terima & Setujui</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM APPROVE MODAL */}
      {approveConfirmOpen && inspectReport && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Persetujuan Laporan?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Anda akan menyetujui laporan <strong>{inspectReport.nomor_laporan}</strong>. Sistem akan secara otomatis:
            </p>
            <ul className="text-xs text-slate-700 mt-2 space-y-1 list-disc list-inside bg-slate-50 p-3 rounded-xl border border-slate-200">
              <li>Memotong stok barang di gudang terkait</li>
              <li>Memperbarui status pembayaran menjadi <strong>Diterima</strong></li>
              <li>Menambahkan omzet ke rekapitulasi keuangan</li>
              <li>Mengirim notifikasi persetujuan ke sales PIC</li>
            </ul>

            <div className="mt-6 flex space-x-2">
              <button
                onClick={() => setApproveConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleApproveReport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white shadow-md"
              >
                Ya, Setujui Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalOpen && inspectReport && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Alasan Penolakan Laporan</h3>
            <p className="text-xs text-slate-600 mt-1">
              Admin wajib menuliskan alasan penolakan secara jelas agar PIC dapat merevisi data atau bukti transfer.
            </p>

            {rejectError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {rejectError}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alasan Penolakan (Wajib Diisi):
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectError(null);
                }}
                placeholder="Contoh: Bukti transfer buram / nominal tidak sesuai / selisih perhitungan stok..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="mt-6 flex space-x-2">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectError(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleRejectReport}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-md"
              >
                Kirim Penolakan ke PIC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ZOOM RECEIPT */}
      {zoomReceipt && inspectReport?.pembayaran?.bukti_transfer_url && (
        <div
          onClick={() => setZoomReceipt(false)}
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/90 p-4 cursor-pointer"
        >
          <img
            src={inspectReport.pembayaran.bukti_transfer_url}
            alt="Bukti Transfer Zoom"
            className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
