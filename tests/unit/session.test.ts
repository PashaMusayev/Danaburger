import { hashSync } from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { checkPassword, createSession, verifySession } from '@/lib/admin/session';
import { _resetForTests, loginFailed, loginStatus } from '@/lib/admin/ratelimit';

const SECRET = 'unit-test-secret-that-is-long-enough-123';

describe('session cookie', () => {
  it('round-trips and expires after 30 days', () => {
    const t = createSession(SECRET, 0);
    expect(verifySession(t, SECRET, 1000)).toBe(true);
    expect(verifySession(t, SECRET, 31 * 864e5)).toBe(false);
  });
  it('rejects tampering and the wrong secret', () => {
    const t = createSession(SECRET);
    const [payload, sig] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ exp: Date.now() + 1e12 })).toString('base64url');
    expect(verifySession(`${forged}.${sig}`, SECRET)).toBe(false);
    expect(verifySession(t, 'another-secret-another-secret-12345')).toBe(false);
    expect(verifySession(`${payload}.`, SECRET)).toBe(false);
    expect(verifySession(undefined, SECRET)).toBe(false);
  });
});

describe('password', () => {
  const raw = hashSync('düz-parol', 4);
  it('accepts base64-encoded and raw bcrypt hashes', async () => {
    expect(await checkPassword('düz-parol', Buffer.from(raw).toString('base64'))).toBe(true);
    expect(await checkPassword('düz-parol', raw)).toBe(true);
    expect(await checkPassword('səhv', raw)).toBe(false);
    expect(await checkPassword('x', 'not-a-hash')).toBe(false);
  });
});

describe('login rate limit', () => {
  it('blocks for 15 minutes after 5 failures', () => {
    _resetForTests();
    for (let i = 0; i < 4; i++) loginFailed('ip', 0);
    expect(loginStatus('ip', 0)).toMatchObject({ blocked: false, remaining: 1 });
    loginFailed('ip', 0);
    expect(loginStatus('ip', 60_000)).toMatchObject({ blocked: true, retryAfter: 840 });
    expect(loginStatus('ip', 15 * 60_000 + 1)).toMatchObject({ blocked: false, remaining: 5 });
    expect(loginStatus('other', 0).blocked).toBe(false);
  });
});
