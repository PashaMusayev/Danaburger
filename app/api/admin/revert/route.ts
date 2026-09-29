import { commitFiles, friendlyError, headSha, MENU_PATH, readFile } from '@/lib/admin/github';
import { json, requireAdmin } from '@/lib/admin/server';
import { commitMessage, diffMenu } from '@/lib/admin/diff';
import { formatMenu } from '@/lib/admin/format';
import { validateMenu } from '@/lib/admin/validate';

export const dynamic = 'force-dynamic';

/** Restores data/menu.json as it was in `commitSha`, as a new commit (history is never rewritten). */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('res' in auth) return auth.res;
  const { env } = auth;
  const body = (await req.json().catch(() => ({}))) as { commitSha?: unknown; baseMenuSha?: unknown; date?: unknown };
  if (typeof body.commitSha !== 'string' || !/^[0-9a-f]{40}$/.test(body.commitSha) || typeof body.baseMenuSha !== 'string') {
    return json({ error: 'Sorğu düzgün deyil.' }, 400);
  }
  try {
    const head = await headSha(env);
    const [cur, old] = await Promise.all([readFile(env, MENU_PATH, head), readFile(env, MENU_PATH, body.commitSha)]);
    if (cur.sha !== body.baseMenuSha) return json({ error: 'Menyu başqa yerdən dəyişdirilib. Səhifəni yeniləyin.' }, 409);
    const oldMenu = JSON.parse(old.text);
    const errs = validateMenu(oldMenu);
    if (errs.length) return json({ error: 'Bu versiyanı bərpa etmək olmur.', details: errs.slice(0, 10) }, 422);
    const text = formatMenu(oldMenu);
    if (text === cur.text) return json({ error: 'Menyu artıq bu versiyadadır.' }, 400);
    const changes = diffMenu(JSON.parse(cur.text), oldMenu);
    const when = typeof body.date === 'string' ? body.date.slice(0, 40) : body.commitSha.slice(0, 7);
    const { commitSha, blobs } = await commitFiles(env, {
      head,
      files: [{ path: MENU_PATH, text }],
      message: commitMessage([`geri qaytarıldı (${when} versiyası)`, ...changes]),
      expect: {}, // shas were checked against `head` above; the ref update still refuses if the branch moved
    });
    return json({ commitSha, menuSha: blobs[MENU_PATH], changes });
  } catch (e) {
    const f = friendlyError(e);
    return json({ error: f.error }, f.status);
  }
}
