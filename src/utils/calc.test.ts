import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStokAkhir,
  validateStockCalculation,
  calculateSubtotal,
  formatRupiah,
  filterReportsByRange,
} from './calc';


test('calculateStokAkhir calculates accurately: stok_awal - terjual - sample - titip', () => {
  const result = calculateStokAkhir({
    stok_awal: 100,
    terjual: 45,
    sample_bonus: 5,
    titip_toko: 10,
  });
  assert.equal(result, 40);
});

test('calculateStokAkhir handles zero and edge values properly', () => {
  const result = calculateStokAkhir({
    stok_awal: 50,
    terjual: 50,
    sample_bonus: 0,
    titip_toko: 0,
  });
  assert.equal(result, 0);
});

test('validateStockCalculation validates non-negative stock_akhir', () => {
  const validCheck = validateStockCalculation({
    stok_awal: 100,
    terjual: 60,
    sample_bonus: 10,
    titip_toko: 15,
  });
  assert.equal(validCheck.isValid, true);
  assert.equal(validCheck.stok_akhir, 15);
  assert.equal(validCheck.errors.length, 0);

  // Negative ending stock
  const invalidCheck = validateStockCalculation({
    stok_awal: 50,
    terjual: 40,
    sample_bonus: 15,
    titip_toko: 10,
  });
  assert.equal(invalidCheck.isValid, false);
  assert.equal(invalidCheck.stok_akhir, -15);
  assert.match(invalidCheck.errors[0], /tidak boleh negatif/i);
});

test('validateStockCalculation rejects negative inputs', () => {
  const negativeInput = validateStockCalculation({
    stok_awal: 100,
    terjual: -5,
    sample_bonus: 0,
    titip_toko: 0,
  });
  assert.equal(negativeInput.isValid, false);
  assert.match(negativeInput.errors[0], /terjual harus berupa angka >= 0/i);
});

test('calculateSubtotal multiplies quantity by base price', () => {
  assert.equal(calculateSubtotal(20, 15000), 300000);
  assert.equal(calculateSubtotal(0, 15000), 0);
});

test('formatRupiah formats currency in Indonesian Rupiah standard', () => {
  const formatted = formatRupiah(150000);
  assert.match(formatted, /Rp/);
  assert.match(formatted, /150/);
});

test('filterReportsByRange filters correctly by area and all range', () => {
  const dummy = [
    { id: '1', created_at: '2026-10-24T05:00:00Z', area_id: 'area-1', status: 'Diterima' as const },
    { id: '2', created_at: '2026-10-20T05:00:00Z', area_id: 'area-2', status: 'Diterima' as const },
    { id: '3', created_at: '2026-09-01T05:00:00Z', area_id: 'area-1', status: 'Ditolak' as const },
  ];

  const allFiltered = filterReportsByRange(dummy, 'all', 'all');
  assert.equal(allFiltered.length, 3);

  const areaFiltered = filterReportsByRange(dummy, 'all', 'area-1');
  assert.equal(areaFiltered.length, 2);

  const refDate = new Date('2026-10-24T12:00:00Z');
  const todayFiltered = filterReportsByRange(dummy, 'today', 'all', refDate);
  assert.equal(todayFiltered.length, 1);
  assert.equal(todayFiltered[0].id, '1');
});

