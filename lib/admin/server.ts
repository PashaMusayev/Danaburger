import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminEnv, type AdminEnv } from './env';
import { SESSION_COOKIE, verifySession } from './session';

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

/** Cookies are sameSite=strict already; this also rejects cross-site POSTs outright. */
function sameOrigin(req: Request): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Every /api/admin/* handler starts with this. Returns the env, or a response to send back. */
export async function requireAdmin(req: Request): Promise<{ env: AdminEnv } | { res: NextResponse }> {
  const { env, missing } = adminEnv();
  if (!env) return { res: json({ error: 'Admin panel hələ quraşdırılmayıb.', missing }, 503) };
  if (!sameOrigin(req)) return { res: json({ error: 'İcazə yoxdur.' }, 403) };
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySession(token, env.sessionSecret)) return { res: json({ error: 'Sessiya bitib. Yenidən daxil olun.' }, 401) };
  return { env };
}

export { sameOrigin };

/** For server components under /admin (redirects to login when false). */
export async function isLoggedIn(): Promise<boolean> {
  const { env } = adminEnv();
  if (!env) return false;
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value, env.sessionSecret);
}
