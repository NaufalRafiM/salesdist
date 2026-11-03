import React, { useState } from 'react';
import {
  Boxes,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  RefreshCw,
  Search,
  ArrowUpDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import { store } from '../../db/store';
import { StokGudang, Warehouse as WarehouseType, Brand } from '../../types';
import { formatDateID, formatDateTimeID, formatRupiah } from '../../utils/calc';

export const StokGudangView: React.FC = () => {
  const db = store.getState();
  const warehouses = db.warehouses;
  const brands = db.brands;
  const stokList = db.stok_gudang;

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal edit / tambah stok
  const [editingStok, setEditingStok] = useState<{
    entry: StokGudang;
    brand: Brand;
    warehouse: WarehouseType;
  } | null>(null);
  const [newStockInput, setNewStockInput] = useState<number | string>('');

  const filteredStok = stokList.filter((s) => {
    const matchesWh = selectedWarehouseId === 'all' || s.warehouse_id === selectedWarehouseId;
    const brand = brands.find((b) => b.id === s.brand_id);
    const matchesSearch =
      (brand?.brand_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (brand?.sku_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesWh && matchesSearch;
  });

  const getStatusBadge = (status: StokGudang['status'], count: number) => {
    if (count === 0 || status === 'habis') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
          Habis (0)
        </span>
      );
    }
    if (count <= 50 || status === 'menipis') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
          Menipis ({count})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
        Aman ({count})
      </span>
    );
  };

  const handleOpenEdit = (entry: StokGudang) => {
    const brand = brands.find((b) => b.id === entry.brand_id);
    const wh = warehouses.find((w) => w.id === entry.warehouse_id);
    if (brand && wh) {
      setEditingStok({ entry, brand, warehouse: wh });
      setNewStockInput(entry.current_stock);
    }
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStok) return;

    const qty = Math.max(0, parseInt(String(newStockInput), 10) || 0);
    store.updateStokGudang(editingStok.entry.id, qty);
    setEditingStok(null);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Monitoring Stok Gudang Distribusi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau ketersediaan stok fisik per gudang hub. Stok berkurang otomatis setiap laporan PIC disetujui.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 hidden sm:inline">Pilih Hub Gudang:</span>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="all">Semua Gudang ({warehouses.length})</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nama_gudang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warehouse Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {warehouses.map((wh) => {
          const whStoks = stokList.filter((s) => s.warehouse_id === wh.id);
          const totalPacks = whStoks.reduce((acc, s) => acc + s.current_stock, 0);
          const criticalCount = whStoks.filter((s) => s.current_stock <= 50).length;

          return (
            <div
              key={wh.id}
              onClick={() => setSelectedWarehouseId(wh.id)}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer ${
                selectedWarehouseId === wh.id
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    HUB AKTIF
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">{wh.nama_gudang}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{wh.lokasi}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-600 text-white">
                  <Warehouse className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Total Stok Fisik:</span>
                  <strong className="text-sm font-extrabold text-slate-900">{totalPacks} Pack</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Status Kritis:</span>
                  {criticalCount > 0 ? (
                    <span className="font-bold text-amber-700">{criticalCount} SKU Menipis/Habis</span>
                  ) : (
                    <span className="font-bold text-emerald-700">Semua SKU Aman</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Table & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Rincian Stok Barang Per Brand SKU</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari brand atau SKU..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Gudang</th>
                <th className="py-3 px-4">Brand & SKU</th>
                <th className="py-3 px-4 text-center">Harga Dasar</th>
                <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Terakhir Update</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredStok.map((entry) => {
                const brand = brands.find((b) => b.id === entry.brand_id);
                const wh = warehouses.find((w) => w.id === entry.warehouse_id);

                return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {wh?.nama_gudang}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{brand?.brand_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {brand?.sku_code} &bull; {brand?.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {formatRupiah(brand?.base_price || 0)}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-black text-sm text-slate-900">
                      {entry.current_stock} <span className="text-[10px] font-normal text-slate-500">pack</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(entry.status, entry.current_stock)}
                    </td>

                    <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                      {formatDateTimeID(entry.last_updated)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(entry)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 font-semibold text-xs transition flex items-center space-x-1 mx-auto"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Sesuaikan</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST STOCK MODAL */}
      {editingStok && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100">
              <Boxes className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-base text-slate-900">Penyesuaian / Restock Fisik</h3>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs space-y-1">
              <p><strong>Gudang:</strong> {editingStok.warehouse.nama_gudang}</p>
              <p><strong>Produk:</strong> {editingStok.brand.brand_name} ({editingStok.brand.sku_code})</p>
              <p><strong>Stok Saat Ini:</strong> {editingStok.entry.current_stock} pack</p>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jumlah Stok Fisik Baru (Pack)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStok(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 font-bold text-xs text-white shadow-md"
                >
                  Simpan Perubahan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
