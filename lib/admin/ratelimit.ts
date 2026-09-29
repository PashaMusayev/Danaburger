import 'server-only';

export const MAX_FAILS = 5;
export const BLOCK_MS = 15 * 60 * 1000;

type Entry = { fails: number; until: number };
const store = new Map<string, Entry>();

// In-memory, per server instance. Vercel may run several instances, so this slows a password-guesser
// down rather than stopping one completely; bcrypt (cost 12) makes every guess expensive on top of it.
export function loginStatus(key: string, now = Date.now()): { blocked: boolean; retryAfter: number; remaining: number } {
  const e = store.get(key);
  if (e && e.until > now) return { blocked: true, retryAfter: Math.ceil((e.until - now) / 1000), remaining: 0 };
  if (e && e.until && e.until <= now) store.delete(key);
  return { blocked: false, retryAfter: 0, remaining: MAX_FAILS - (store.get(key)?.fails ?? 0) };
}

export function loginFailed(key: string, now = Date.now()) {
  const e = store.get(key) ?? { fails: 0, until: 0 };
  e.fails += 1;
  if (e.fails >= MAX_FAILS) e.until = now + BLOCK_MS;
  store.set(key, e);
}

export const loginSucceeded = (key: string) => store.delete(key);

export const _resetForTests = () => store.clear();
