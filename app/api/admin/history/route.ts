import { friendlyError, menuHistory } from '@/lib/admin/github';
import { json, requireAdmin } from '@/lib/admin/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('res' in auth) return auth.res;
  try {
    return json({ commits: await menuHistory(auth.env, 30) });
  } catch (e) {
    const f = friendlyError(e);
    return json({ error: f.error }, f.status);
  }
}
