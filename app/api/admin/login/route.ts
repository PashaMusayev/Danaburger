import { NextResponse } from 'next/server';
import { adminEnv } from '@/lib/admin/env';
import { checkPassword, createSession, SESSION_COOKIE, SESSION_DAYS } from '@/lib/admin/session';
import { loginFailed, loginStatus, loginSucceeded } from '@/lib/admin/ratelimit';
import { json, sameOrigin } from '@/lib/admin/server';

export const dynamic = 'force-dynamic';

const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';

export async function POST(req: Request) {
  const { env, missing } = adminEnv();
  if (!env) return json({ error: 'Admin panel hələ quraşdırılmayıb.', missing }, 503);
  if (!sameOrigin(req)) return json({ error: 'İcazə yoxdur.' }, 403);

  const ip = clientIp(req);
  const status = loginStatus(ip);
  if (status.blocked) {
    const min = Math.ceil(status.retryAfter / 60);
    return json({ error: `Çox səhv cəhd oldu. ${min} dəqiqə sonra yenidən yoxlayın.`, retryAfter: status.retryAfter }, 429);
  }

  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
  if (!password || !(await checkPassword(password, env.passwordHash))) {
    loginFailed(ip);
    const after = loginStatus(ip);
    if (after.blocked) return json({ error: 'Çox səhv cəhd oldu. 15 dəqiqə sonra yenidən yoxlayın.', retryAfter: after.retryAfter }, 429);
    return json({ error: `Parol səhvdir. ${after.remaining} cəhd qalıb.`, remaining: after.remaining }, 401);
  }

  loginSucceeded(ip);
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set(SESSION_COOKIE, createSession(env.sessionSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
  return res;
}
