import { commitFiles, friendlyError, headSha } from '@/lib/admin/github';
import { loadData, loadMenusAt } from '@/lib/admin/load';
import { json, requireAdmin } from '@/lib/admin/server';
import { commitMessage, diffData } from '@/lib/admin/diff';
import { validateData } from '@/lib/admin/validate';
import { serialize, trackedPaths, type AdminData } from '@/lib/admin/model';

export const dynamic = 'force-dynamic';

/**
 * Restores the catalog and every branch's menu as they were in `commitSha`, as a new commit (history is never
 * rewritten). Contacts, addresses and settings are left as they are now.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('res' in auth) return auth.res;
  const { env } = auth;
  const body = (await req.json().catch(() => ({}))) as { commitSha?: unknown; baseShas?: Record<string, string>; date?: unknown };
  if (typeof body.commitSha !== 'string' || !/^[0-9a-f]{40}$/.test(body.commitSha) || !body.baseShas || typeof body.baseShas !== 'object') {
    return json({ error: 'Sorğu düzgün deyil.' }, 400);
  }
  try {
    const head = await headSha(env);
    const cur = await loadData(env, head);
    const branchIds = cur.data.branches.branches.map((b) => b.id);
    if (trackedPaths(branchIds).some((p) => cur.shas[p] !== body.baseShas![p])) {
      return json({ error: 'Menyu başqa yerdən dəyişdirilib. Səhifəni yeniləyin.' }, 409);
    }
    const old = await loadMenusAt(env, body.commitSha, branchIds);
    if (!old) return json({ error: 'Bu versiya filiallar əlavə olunmazdan əvvəlkidir, onu bərpa etmək olmur.' }, 422);
    const next: AdminData = { ...cur.data, catalog: { ...old.catalog, categories: cur.data.catalog.categories }, menus: old.menus };
    const errs = validateData(next);
    if (errs.length) return json({ error: 'Bu versiyanı bərpa etmək olmur.', details: errs.slice(0, 10) }, 422);
    const texts = serialize(next);
    const files = Object.entries(texts)
      .filter(([p, t]) => cur.texts[p] !== t)
      .map(([path, text]) => ({ path, text }));
    if (!files.length) return json({ error: 'Menyu artıq bu versiyadadır.' }, 400);
    const changes = diffData(cur.data, next);
    const when = typeof body.date === 'string' ? body.date.slice(0, 40) : body.commitSha.slice(0, 7);
    const { commitSha, blobs } = await commitFiles(env, {
      head,
      files,
      message: commitMessage([`geri qaytarıldı (${when} versiyası)`, ...changes]),
      expect: {},
    });
    return json({ commitSha, shas: { ...cur.shas, ...blobs }, changes });
  } catch (e) {
    const f = friendlyError(e);
    return json({ error: f.error }, f.status);
  }
}
