import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Package,
  CreditCard,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileText,
  Trash2,
  Camera,
  Image as ImageIcon,
  Check,
  Send,
  ArrowLeft,
  X,
} from 'lucide-react';
import { User, LaporanDistribusi } from '../../types';
import { store } from '../../db/store';
import { formatRupiah, calculateSubtotal } from '../../utils/calc';
import { DAFTAR_KAB_KOTA_INDONESIA } from '../../data/indonesiaKabKota';
import { SAMPLE_TRANSFER_RECEIPT_1 } from '../../data/seedData';

interface LaporanFormProps {
  currentUser: User;
  onSuccess: () => void;
  reportToRevise?: LaporanDistribusi | null;
  onCancelRevise?: () => void;
}

export const LaporanForm: React.FC<LaporanFormProps> = ({
  currentUser,
  onSuccess,
  reportToRevise,
  onCancelRevise,
}) => {
  const db = store.getState();
  const brands = db.brands;
  const areas = db.areas;
  const warehouses = db.warehouses;

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // SECTION 1: Informasi Area & PIC
  const initialAreaName = () => {
    if (reportToRevise) {
      const a = areas.find((ar) => ar.id === reportToRevise.area_id);
      return a ? a.nama_kota_kabupaten : 'Kab. Boyolali';
    }
    const userArea = areas.find((ar) => ar.id === currentUser.assigned_area_id);
    return userArea ? userArea.nama_kota_kabupaten : 'Kab. Boyolali';
  };

  const [areaInput, setAreaInput] = useState<string>(initialAreaName);
  const [picInput, setPicInput] = useState<string>(currentUser.nama_lengkap);
  const [periodeMulai, setPeriodeMulai] = useState<string>(
    reportToRevise ? reportToRevise.periode_mulai : fiveDaysAgo
  );
  const [periodeSelesai, setPeriodeSelesai] = useState<string>(
    reportToRevise ? reportToRevise.periode_selesai : today
  );

  // SECTION 2: Data Penjualan Brand
  // Default to Otentik 12 if present, otherwise first brand
  const defaultBrand = brands.find((b) => b.brand_name.toLowerCase().includes('otentik 12')) || brands[0];
  const [selectedBrandId, setSelectedBrandId] = useState<string>(() => {
    if (reportToRevise && reportToRevise.details?.[0]) {
      return reportToRevise.details[0].brand_id;
    }
    return defaultBrand?.id || '';
  });

  const [stokAwal, setStokAwal] = useState<string>(() => {
    if (reportToRevise && reportToRevise.details?.[0]) {
      return String(reportToRevise.details[0].stok_awal);
    }
    return '100';
  });

  const [titipToko, setTitipToko] = useState<string>(() => {
    if (reportToRevise && reportToRevise.details?.[0]) {
      return String(reportToRevise.details[0].titip_toko);
    }
    return '15';
  });

  const [sampleBonus, setSampleBonus] = useState<string>(() => {
    if (reportToRevise && reportToRevise.details?.[0]) {
      return String(reportToRevise.details[0].sample_bonus);
    }
    return '5';
  });

  const [terjual, setTerjual] = useState<string>(() => {
    if (reportToRevise && reportToRevise.details?.[0]) {
      return String(reportToRevise.details[0].terjual);
    }
    return '70';
  });

  // Calculate Stok Akhir automatically: awal - titip - sample - terjual
  const numAwal = parseInt(stokAwal, 10) || 0;
  const numTitip = parseInt(titipToko, 10) || 0;
  const numSample = parseInt(sampleBonus, 10) || 0;
  const numTerjual = parseInt(terjual, 10) || 0;
  const stokAkhir = stokAwal !== '' ? numAwal - numTitip - numSample - numTerjual : '';

  // Brand object & subtotal
  const currentBrand = brands.find((b) => b.id === selectedBrandId) || defaultBrand;
  const estimatedSubtotal = calculateSubtotal(numTerjual, currentBrand?.base_price || 16500);

  // SECTION 3: Rincian Pembayaran (Payment)
  const [nominalTransfer, setNominalTransfer] = useState<string>(() => {
    if (reportToRevise?.pembayaran?.nominal_transfer) {
      return String(reportToRevise.pembayaran.nominal_transfer);
    }
    return String(estimatedSubtotal || 1155000);
  });

  const [tanggalTransfer, setTanggalTransfer] = useState<string>(() => {
    if (reportToRevise?.pembayaran?.tanggal_tf) {
      return reportToRevise.pembayaran.tanggal_tf;
    }
    return today;
  });

  const [keterangan, setKeterangan] = useState<string>(() => {
    return reportToRevise?.catatan_tambahan || '';
  });

  // Auto-update nominal transfer when terjual changes if user hasn't manually customized it
  useEffect(() => {
    if (!reportToRevise && estimatedSubtotal > 0) {
      setNominalTransfer(String(estimatedSubtotal));
    }
  }, [estimatedSubtotal, reportToRevise]);

  // SECTION 4: Bukti Transfer
  const [imagePreview, setImagePreview] = useState<string | null>(() => {
    return reportToRevise?.pembayaran?.bukti_transfer_url || null;
  });
  const [sumberText, setSumberText] = useState<string>(() => {
    return reportToRevise?.pembayaran?.bukti_transfer_url ? 'Sumber: Foto Bukti Sebelumnya' : '';
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Handle camera or gallery selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'gallery') => {
    const input = e.target;
    if (source === 'camera') {
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      setSumberText('Sumber: Kamera Langsung');
    } else {
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      setSumberText('Sumber: Upload Galeri');
    }

    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
          setFormError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetImage = () => {
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    setImagePreview(null);
    setSumberText('');
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation 1: Area
    if (!areaInput.trim()) {
      setFormError('Mohon isi nama Area (Kota/Kabupaten).');
      return;
    }

    // Validation 2: Stok Akhir non-negative
    if (typeof stokAkhir === 'number' && stokAkhir < 0) {
      setFormError(
        `Stok Akhir tidak boleh bernilai negatif (${stokAkhir}). Jumlah terjual (${numTerjual}) + titip (${numTitip}) + sample (${numSample}) melebihi stok awal (${numAwal}).`
      );
      return;
    }

    // Validation 3: Nominal Transfer
    const nominal = parseInt(nominalTransfer, 10);
    if (!nominal || nominal <= 0) {
      setFormError('Mohon masukkan nominal transfer pembayaran yang valid.');
      return;
    }

    // Validation 4: Bukti Transfer
    if (!imagePreview) {
      setFormError('Mohon unggah bukti transfer (Ambil Foto atau Buka Galeri) terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find or match area
      let matchedArea = areas.find(
        (a) => a.nama_kota_kabupaten.toLowerCase() === areaInput.trim().toLowerCase()
      );
      if (!matchedArea) {
        matchedArea = areas[0];
      }

      const defaultWarehouse = warehouses[0]?.id || 'wh-1';

      if (reportToRevise) {
        // Update existing report revision
        const res = store.reviseLaporan(reportToRevise.id, {
          area_id: matchedArea?.id || reportToRevise.area_id,
          warehouse_id: reportToRevise.warehouse_id || defaultWarehouse,
          periode_mulai: periodeMulai,
          periode_selesai: periodeSelesai,
          catatan_tambahan: keterangan || undefined,
          details: [
            {
              brand_id: currentBrand?.id || selectedBrandId,
              stok_awal: numAwal,
              terjual: numTerjual,
              sample_bonus: numSample,
              titip_toko: numTitip,
              stok_akhir: typeof stokAkhir === 'number' ? stokAkhir : 0,
              base_price: currentBrand?.base_price || 16500,
              subtotal: estimatedSubtotal,
            },
          ],
          pembayaran: {
            metode: 'bank transfer',
            bank_tujuan: 'BCA (PT Salesdist Indo - 88201928331)',
            nominal_transfer: nominal,
            tanggal_tf: tanggalTransfer,
            bukti_transfer_url: imagePreview || SAMPLE_TRANSFER_RECEIPT_1,
          },
        });

        if (res.success) {
          setSuccessNotice('Laporan revisi berhasil dikirim ke Admin untuk verifikasi ulang!');
          setTimeout(() => {
            onSuccess();
          }, 1200);
        } else {
          setFormError(res.error || 'Gagal mengirim revisi laporan.');
          setIsSubmitting(false);
        }
      } else {
        // Create new report
        const res = store.createLaporan({
          pic_id: currentUser.id,
          area_id: matchedArea?.id || 'area-boyolali',
          warehouse_id: defaultWarehouse,
          periode_mulai: periodeMulai,
          periode_selesai: periodeSelesai,
          catatan_tambahan: keterangan || undefined,
          details: [
            {
              brand_id: currentBrand?.id || selectedBrandId,
              stok_awal: numAwal,
              terjual: numTerjual,
              sample_bonus: numSample,
              titip_toko: numTitip,
              stok_akhir: typeof stokAkhir === 'number' ? stokAkhir : 0,
              base_price: currentBrand?.base_price || 16500,
              subtotal: estimatedSubtotal,
            },
          ],
          pembayaran: {
            metode: 'bank transfer',
            bank_tujuan: 'BCA (PT Salesdist Indo - 88201928331)',
            nominal_transfer: nominal,
            tanggal_tf: tanggalTransfer,
            bukti_transfer_url: imagePreview || undefined,
          },
        });

        if (res.success) {
          setSuccessNotice('Laporan distribusi berhasil diproses dan dikirim ke Admin!');
          setTimeout(() => {
            onSuccess();
          }, 1200);
        } else {
          setFormError(res.error || 'Gagal menyimpan laporan.');
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-6 px-4 bg-slate-100 flex flex-col items-center">
      {/* Revision Banner if applicable */}
      {reportToRevise && (
        <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 text-xs text-amber-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Mode Revisi: <strong>{reportToRevise.nomor_laporan}</strong>
            </span>
          </div>
          {onCancelRevise && (
            <button
              onClick={onCancelRevise}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline"
            >
              Batal Revisi
            </button>
          )}
        </div>
      )}

      {/* SUCCESS NOTICE */}
      {successNotice && (
        <div className="w-full max-w-md bg-emerald-600 text-white p-4 rounded-xl shadow-lg mb-4 text-xs font-bold text-center flex items-center justify-center space-x-2 animate-pulse">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ERROR NOTICE */}
      {formError && (
        <div className="w-full max-w-md bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl shadow-xs mb-4 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* MAIN CONTAINER MATCHING https://subsigawhs.blogspot.com/ */}
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Laporan Distribusi & Sales</h2>
          <p className="text-xs text-gray-500 mt-1">
            Isi data penjualan dan bukti pembayaran di bawah ini
          </p>
        </div>

        <form id="salesForm" onSubmit={handleSubmit}>
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
                list="daftar_kota"
                name="area"
                placeholder="Contoh: Boyolali"
                required
                type="text"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
              />
              <datalist id="daftar_kota">
                {DAFTAR_KAB_KOTA_INDONESIA.map((kota) => (
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
                placeholder="Masukkan nama PIC"
                required
                type="text"
                value={picInput}
                onChange={(e) => setPicInput(e.target.value)}
              />
            </div>

            {/* Periode Mulai & Selesai */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Periode Mulai</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  name="periode_mulai"
                  required
                  type="date"
                  value={periodeMulai}
                  onChange={(e) => setPeriodeMulai(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Periode Selesai</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  name="periode_selesai"
                  required
                  type="date"
                  value={periodeSelesai}
                  onChange={(e) => setPeriodeSelesai(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DATA PENJUALAN BRAND */}
          <div className="bg-orange-50/50 p-4 rounded-lg mb-4 border border-orange-100">
            <h3 className="text-sm font-bold text-orange-700 mb-3 border-b border-orange-100 pb-1">
              📦 Data Penjualan Brand
            </h3>

            {/* DROPDOWN PILIHAN BRAND */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Pilih Brand</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-gray-700 font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none"
                name="nama_brand"
                required
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
              >
                <option value="" disabled>
                  -- Pilih Brand --
                </option>
                {/* Specific 4 brands from subsigawhs blogspot prioritized */}
                <option value={brands.find((b) => b.brand_name.includes('Otentik 12'))?.id || 'brd-otk-12'}>
                  Otentik 12
                </option>
                <option value={brands.find((b) => b.brand_name.includes('Otentik 16'))?.id || 'brd-otk-16'}>
                  Otentik 16
                </option>
                <option value={brands.find((b) => b.brand_name.includes('Mag. Blewah 12'))?.id || 'brd-mgb-12'}>
                  Mag. Blewah 12
                </option>
                <option value={brands.find((b) => b.brand_name.includes('Mag. Blewah 16'))?.id || 'brd-mgb-16'}>
                  Mag. Blewah 16
                </option>
                {/* Other catalog brands */}
                {brands
                  .filter(
                    (b) =>
                      !b.brand_name.includes('Otentik') && !b.brand_name.includes('Mag. Blewah')
                  )
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brand_name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Grid Stok Awal & Titip Toko */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Stok Awal (Pack)</label>
                <input
                  className="w-full px-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                  id="stok_awal"
                  name="stok_awal"
                  placeholder="0"
                  required
                  type="number"
                  min="0"
                  value={stokAwal}
                  onChange={(e) => setStokAwal(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Titip Toko (Pack)</label>
                <input
                  className="w-full px-3 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                  id="titip"
                  name="titip"
                  placeholder="0"
                  type="number"
                  min="0"
                  value={titipToko}
                  onChange={(e) => setTitipToko(e.target.value)}
                />
              </div>
            </div>

            {/* Grid Sample, Terjual, Stok Akhir */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sample/Bonus</label>
                <input
                  className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                  id="sample"
                  name="sample"
                  placeholder="0"
                  type="number"
                  min="0"
                  value={sampleBonus}
                  onChange={(e) => setSampleBonus(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Terjual</label>
                <input
                  className="w-full px-2 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                  id="terjual"
                  name="terjual"
                  placeholder="0"
                  type="number"
                  min="0"
                  value={terjual}
                  onChange={(e) => setTerjual(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 font-bold mb-1">Stok Akhir</label>
                <input
                  className="w-full px-2 py-1.5 border rounded-md text-sm bg-orange-100 font-bold text-orange-800 focus:outline-none"
                  id="stok_akhir"
                  name="stok_akhir"
                  placeholder="0"
                  readOnly
                  type="text"
                  value={stokAkhir}
                />
              </div>
            </div>

            {/* Realtime Omzet helper */}
            <div className="mt-2.5 pt-2 border-t border-orange-100 flex items-center justify-between text-xs text-orange-950 font-medium">
              <span>Nilai Terjual ({currentBrand?.brand_name || 'Brand'}):</span>
              <strong className="font-bold text-orange-800">
                {formatRupiah(estimatedSubtotal)}
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
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                  name="nominal_transfer"
                  placeholder="Contoh: 1500000"
                  required
                  type="number"
                  min="0"
                  value={nominalTransfer}
                  onChange={(e) => setNominalTransfer(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal TF</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                  name="tanggal_transfer"
                  required
                  type="date"
                  value={tanggalTransfer}
                  onChange={(e) => setTanggalTransfer(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white p-3 rounded border border-emerald-100/70">
              <label className="block text-xs font-bold text-emerald-800 mb-2">
                Keterangan Tambahan:
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                name="keterangan"
                placeholder="Catatan tambahan (opsional)..."
                rows={2}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 4: UPLOAD BUKTI TRANSFER (DENGAN PILIHAN) */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 mb-2">📸 Bukti Transfer</label>

            {/* Dua Tombol Pilihan */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                className="flex flex-col items-center justify-center py-3 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition shadow-xs cursor-pointer active:scale-98"
                onClick={() => cameraInputRef.current?.click()}
                type="button"
              >
                <Camera className="w-6 h-6 mb-1 text-blue-600" />
                <span className="text-[11px] font-bold">Ambil Foto</span>
              </button>

              <button
                className="flex flex-col items-center justify-center py-3 border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition shadow-xs cursor-pointer active:scale-98"
                onClick={() => galleryInputRef.current?.click()}
                type="button"
              >
                <ImageIcon className="w-6 h-6 mb-1 text-emerald-600" />
                <span className="text-[11px] font-bold">Buka Galeri</span>
              </button>
            </div>

            {/* Hidden Inputs untuk memicu kamera/galeri */}
            <input
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={cameraInputRef}
              onChange={(e) => handleImageSelect(e, 'camera')}
              type="file"
            />
            <input
              accept="image/*"
              className="hidden"
              ref={galleryInputRef}
              onChange={(e) => handleImageSelect(e, 'gallery')}
              type="file"
            />

            {/* Area Preview Gambar */}
            {imagePreview ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                <p className="text-[10px] text-gray-500 mb-2 font-medium" id="sumber_text">
                  Foto berhasil dimuat &bull; {sumberText || 'Sumber: Kamera / Galeri'}
                </p>
                <img
                  alt="Preview Bukti"
                  src={imagePreview}
                  className="max-h-48 rounded shadow-xs z-20 object-contain"
                />
                <button
                  className="mt-3 px-3 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded hover:bg-red-200 transition cursor-pointer"
                  onClick={resetImage}
                  type="button"
                >
                  Hapus Gambar
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center text-xs text-slate-400 bg-slate-50">
                Pilih salah satu tombol di atas untuk melampirkan foto struk transfer resmi
              </div>
            )}
          </div>

          {/* TOMBOL SUBMIT */}
          <button
            className="w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-md text-sm hover:bg-blue-700 transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            type="submit"
            disabled={isSubmitting}
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Memproses...' : 'Kirim Laporan'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default LaporanForm;
