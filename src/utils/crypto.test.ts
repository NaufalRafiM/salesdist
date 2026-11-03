import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPasswordSync, verifyPassword } from './crypto';

test('hashPasswordSync produces non-plaintext consistent hash', () => {
  const hash1 = hashPasswordSync('admin123');
  const hash2 = hashPasswordSync('admin123');
  assert.equal(hash1, hash2);
  assert.notEqual(hash1, 'admin123');
  assert.ok(hash1.startsWith('sh256_'));
});

test('verifyPassword checks matches and rejects wrong password', () => {
  const storedHash = hashPasswordSync('mySecretPass');
  assert.equal(verifyPassword('mySecretPass', storedHash), true);
  assert.equal(verifyPassword('wrongSecretPass', storedHash), false);
});
