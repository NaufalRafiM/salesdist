import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from './store';

test('store initializes with seed data', () => {
  const state = store.getState();
  assert.ok(state.users.length >= 4);
  assert.ok(state.brands.length >= 6);
  assert.ok(state.areas.length >= 5);
  assert.ok(state.warehouses.length >= 2);
  assert.ok(state.laporan.length >= 3);
});

test('store login checks credentials and verification status', () => {
  // Valid admin login
  const adminRes = store.login('admin@salesdist.id', 'admin123');
  assert.ok(adminRes.user);
  assert.equal(adminRes.user.role, 'admin');

  // Wrong password
  const failPass = store.login('admin@salesdist.id', 'wrongpass');
  assert.equal(failPass.user, undefined);
  assert.match(failPass.error || '', /kata sandi salah/i);

  // Pending verification PIC
  const pendingRes = store.login('siti@salesdist.id', 'password123');
  assert.equal(pendingRes.user, undefined);
  assert.match(pendingRes.error || '', /menunggu verifikasi/i);
});

test('verifyLaporan Diterima deducts warehouse stock and updates payment', () => {
  store.resetToSeed();
  const stateBefore = store.getState();
  const pendingReport = stateBefore.laporan.find((l) => l.status === 'Menunggu Verifikasi');
  assert.ok(pendingReport);

  const initialStock = stateBefore.stok_gudang.find(
    (s) => s.warehouse_id === pendingReport.warehouse_id && s.brand_id === pendingReport.details![0].brand_id
  )?.current_stock || 0;

  const result = store.verifyLaporan(pendingReport.id, 'usr-admin-1', 'Diterima');
  assert.equal(result.success, true);

  const updatedReport = store.getState().laporan.find((l) => l.id === pendingReport.id);
  assert.equal(updatedReport?.status, 'Diterima');
  assert.equal(updatedReport?.pembayaran?.status, 'Diterima');
  assert.equal(updatedReport?.pembayaran?.verified_by, 'usr-admin-1');

  // Check stock deducted with Math.max(0, initialStock - soldQty)
  const brandId = pendingReport.details![0].brand_id;
  const soldQty = pendingReport.details![0].terjual + pendingReport.details![0].sample_bonus;
  const newStock = store.getState().stok_gudang.find(
    (s) => s.warehouse_id === pendingReport.warehouse_id && s.brand_id === brandId
  )?.current_stock;

  assert.equal(newStock, Math.max(0, initialStock - soldQty));
});

test('verifyLaporan Ditolak requires rejection reason and updates status', () => {
  store.resetToSeed();
  const pendingReport = store.getState().laporan.find((l) => l.status === 'Menunggu Verifikasi');
  assert.ok(pendingReport);

  // Attempt without reason
  const noReason = store.verifyLaporan(pendingReport.id, 'usr-admin-1', 'Ditolak', '');
  assert.equal(noReason.success, false);
  assert.match(noReason.error || '', /wajib mengisi alasan penolakan/i);

  // With reason
  const withReason = store.verifyLaporan(pendingReport.id, 'usr-admin-1', 'Ditolak', 'Bukti transfer buram');
  assert.equal(withReason.success, true);

  const updated = store.getState().laporan.find((l) => l.id === pendingReport.id);
  assert.equal(updated?.status, 'Ditolak');
  assert.equal(updated?.rejection_reason, 'Bukti transfer buram');
});
