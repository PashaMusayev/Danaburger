import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { compare } from 'bcryptjs';

export const SESSION_COOKIE = 'db_admin';
export const SESSION_DAYS = 30;

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

export function createSession(secret: string, now = Date.now()): string {
  const payload = b64url(JSON.stringify({ exp: now + SESSION_DAYS * 864e5 }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySession(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > now;
  } catch {
    return false;
  }
}

/**
 * ADMIN_PASSWORD_HASH is stored base64-encoded (`npm run hash-password` prints it that way),
 * because a raw bcrypt hash contains `$`, which .env files try to expand. A raw `$2…` hash also works.
 */
export function decodeHash(stored: string): string {
  return stored.startsWith('$2') ? stored : Buffer.from(stored, 'base64').toString('utf8');
}

export async function checkPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    return await compare(password, decodeHash(storedHash));
  } catch {
    return false;
  }
}
