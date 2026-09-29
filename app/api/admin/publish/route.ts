import { commitFiles, friendlyError, headSha, type FileChange } from '@/lib/admin/github';
import { loadData } from '@/lib/admin/load';
import { json, requireAdmin } from '@/lib/admin/server';
import { commitMessage, diffData } from '@/lib/admin/diff';
import { validateData } from '@/lib/admin/validate';
import { serialize, trackedPaths, type AdminData } from '@/lib/admin/model';

export const dynamic = 'force-dynamic';

type Body = { baseShas?: Record<string, string>; data?: AdminData; images?: { path: string; sha: string }[] };

const IMAGE_PATH = /^public\/img\/u\/[a-z0-9-]+\.(webp|jpg|png)$/;
const SHA = /^[0-9a-f]{40}$/;

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('res' in auth) return auth.res;
  const { env } = auth;
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.data || !body.baseShas || typeof body.baseShas !== 'object') return json({ error: 'Sorğu düzgün deyil.' }, 400);
  const images = body.images ?? [];
  if (!Array.isArray(images) || images.length > 40 || images.some((i) => !IMAGE_PATH.test(i?.path) || !SHA.test(i?.sha))) {
    return json({ error: 'Foto məlumatı düzgün deyil.' }, 422);
  }

  try {
    const head = await headSha(env);
    const cur = await loadData(env, head);
    const branchIds = cur.data.branches.branches.map((b) => b.id);
    // Someone published from another device since this draft was loaded: refuse, never overwrite.
    if (trackedPaths(branchIds).some((p) => cur.shas[p] !== body.baseShas![p])) {
      return json({ error: 'Menyu başqa yerdən dəyişdirilib. Səhifəni yeniləyin.' }, 409);
    }

    // The panel can't change categories, the currency or which branches exist: keep what's in the repo.
    const incoming = body.data;
    const next: AdminData = {
      catalog: { currency: cur.data.catalog.currency, categories: cur.data.catalog.categories, items: incoming.catalog?.items },
      branches: { branches: branchIds.map((id) => incoming.branches?.branches?.find((b) => b?.id === id) ?? cur.data.branches.branches.find((b) => b.id === id)!) },
      menus: Object.fromEntries(branchIds.map((id) => [id, incoming.menus?.[id]])),
      settings: incoming.settings,
    };
    // Never trust the browser: validate the whole result here.
    const errs = validateData(next);
    if (errs.length) return json({ error: 'Məlumatda səhvlər var.', details: errs.slice(0, 20) }, 422);

    const texts = serialize(next);
    const files: FileChange[] = Object.entries(texts)
      .filter(([p, t]) => cur.texts[p] !== t)
      .map(([path, text]) => ({ path, text }));
    // photos only matter if the catalog actually uses them
    const used = new Set(next.catalog.items.map((i) => i.image).filter(Boolean));
    for (const img of images) if (used.has('/' + img.path.replace(/^public\//, ''))) files.push({ path: img.path, blobSha: img.sha });

    // The commit message is computed here from the real before/after, not taken from the browser.
    const changes = diffData(cur.data, next);
    if (!files.some((f) => f.path.startsWith('data/')) || !changes.length) return json({ error: 'Yayımlanacaq dəyişiklik yoxdur.' }, 400);

    const { commitSha, blobs } = await commitFiles(env, {
      head,
      files,
      message: commitMessage(changes),
      expect: {}, // shas were checked against `head` above; the ref update still refuses if the branch moved
    });
    return json({ commitSha, shas: { ...cur.shas, ...Object.fromEntries(Object.entries(blobs).filter(([p]) => p.startsWith('data/'))) }, changes });
  } catch (e) {
    const f = friendlyError(e);
    return json({ error: f.error }, f.status);
  }
}
