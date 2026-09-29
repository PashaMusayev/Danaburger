import { friendlyError, headSha } from '@/lib/admin/github';
import { loadData } from '@/lib/admin/load';
import { json, requireAdmin } from '@/lib/admin/server';

export const dynamic = 'force-dynamic';

/** Catalog, branches, branch menus and settings as they are on GitHub (the source of truth), with blob shas. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('res' in auth) return auth.res;
  try {
    const head = await headSha(auth.env);
    const { data, shas } = await loadData(auth.env, head);
    return json({ data, shas, head });
  } catch (e) {
    const f = friendlyError(e);
    return json({ error: f.error }, f.status);
  }
}
