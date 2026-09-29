import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/admin/session';
import { sameOrigin, json } from '@/lib/admin/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'İcazə yoxdur.' }, 403);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return res;
}
