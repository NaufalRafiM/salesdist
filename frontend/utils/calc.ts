/**
 * Pure calculation and validation logic for SALESDIST
 */

export interface StockCalculationInput {
  stok_awal: number;
  terjual: number;
  sample_bonus: number;
  titip_toko: number;
}

export interface StockCalculationResult {
  stok_akhir: number;
  isValid: boolean;
  errors: string[];
}

/**
 * Rumus Alur Proses Inti:
 * stok_akhir = stok_awal - terjual - sample_bonus - titip_toko
 * Validasi: stok_akhir tidak boleh negatif dan semua input harus angka >= 0
 */
export function calculateStokAkhir(input: StockCalculationInput): number {
  const awal = Math.max(0, Number(input.stok_awal) || 0);
  const jual = Math.max(0, Number(input.terjual) || 0);
  const sample = Math.max(0, Number(input.sample_bonus) || 0);
  const titip = Math.max(0, Number(input.titip_toko) || 0);

  return awal - jual - sample - titip;
}

export function validateStockCalculation(input: StockCalculationInput): StockCalculationResult {
  const errors: string[] = [];

  const awal = Number(input.stok_awal);
  const jual = Number(input.terjual);
  const sample = Number(input.sample_bonus);
  const titip = Number(input.titip_toko);

  if (isNaN(awal) || awal < 0) {
    errors.push('Stok awal harus berupa angka >= 0');
  }
  if (isNaN(jual) || jual < 0) {
    errors.push('Jumlah terjual harus berupa angka >= 0');
  }
  if (isNaN(sample) || sample < 0) {
    errors.push('Sample/bonus harus berupa angka >= 0');
  }
  if (isNaN(titip) || titip < 0) {
    errors.push('Titip toko harus berupa angka >= 0');
  }

  const stok_akhir = (isNaN(awal) ? 0 : awal) - 
                     (isNaN(jual) ? 0 : jual) - 
                     (isNaN(sample) ? 0 : sample) - 
                     (isNaN(titip) ? 0 : titip);

  if (stok_akhir < 0) {
    errors.push(`Stok akhir tidak boleh negatif (${stok_akhir}). Pengeluaran melebihi stok awal.`);
  }

  return {
    stok_akhir,
    isValid: errors.length === 0,
    errors,
  };
}

export function calculateSubtotal(terjual: number, basePrice: number): number {
  const qty = Math.max(0, Number(terjual) || 0);
  const price = Math.max(0, Number(basePrice) || 0);
  return qty * price;
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateID(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeID(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export type TimeRangeFilter = 'all' | 'month' | 'week' | 'today';

export interface DashboardReportItem {
  id: string;
  created_at: string;
  area_id: string;
  status: 'Menunggu Verifikasi' | 'Diterima' | 'Ditolak';
  details?: Array<{
    brand_id: string;
    terjual: number;
    subtotal: number;
  }>;
  pembayaran?: {
    metode: 'tunai' | 'QRIS' | 'bank transfer';
    nominal_transfer: number;
  };
}

/**
 * Filter reports by date range and area for the admin dashboard
 */
export function filterReportsByRange<T extends DashboardReportItem>(
  reports: T[],
  range: TimeRangeFilter,
  areaId: string = 'all',
  refDate: Date = new Date()
): T[] {
  return reports.filter((r) => {
    // Area filter
    if (areaId !== 'all' && r.area_id !== areaId) {
      return false;
    }

    if (range === 'all') return true;

    const reportDate = new Date(r.created_at);
    if (isNaN(reportDate.getTime())) return true;

    const diffMs = refDate.getTime() - reportDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (range === 'today') {
      return (
        reportDate.getDate() === refDate.getDate() &&
        reportDate.getMonth() === refDate.getMonth() &&
        reportDate.getFullYear() === refDate.getFullYear()
      );
    }

    if (range === 'week') {
      return diffDays <= 7 && diffDays >= 0;
    }

    if (range === 'month') {
      return (
        reportDate.getMonth() === refDate.getMonth() &&
        reportDate.getFullYear() === refDate.getFullYear()
      );
    }

    return true;
  });
}

