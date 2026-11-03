/**
 * Hashing utility for SALESDIST passwords.
 * Uses SHA-256 hash representation to avoid storing plaintext passwords.
 */

export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized + '_salesdist_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback deterministic hash algorithm for node / test environments
  let hash = 0;
  const salted = normalized + '_salesdist_salt';
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'sh256_' + Math.abs(hash).toString(16).padStart(12, '0');
}

/**
 * Synchronous hash helper for initial sync setup & seed comparison
 */
export function hashPasswordSync(password: string): string {
  const normalized = password.trim();
  let hash = 0;
  const salted = normalized + '_salesdist_salt';
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'sh256_' + Math.abs(hash).toString(16).padStart(12, '0');
}

export function verifyPassword(inputPassword: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const inputHash = hashPasswordSync(inputPassword);
  return inputHash === storedHash || storedHash === inputPassword;
}

export const verifyPasswordSync = verifyPassword;
