import { commitFiles, friendlyError, headSha, MENU_PATH, readFile, SETTINGS_PATH, type FileChange } from '@/lib/admin/github';
import { json, requireAdmin } from '@/lib/admin/server';
import { commitMessage, diffMenu, diffSettings } from '@/lib/admin/diff';
import { formatMenu, formatSettings } from '@/lib/admin/format';
import { validateMenu } from '@/lib/admin/validate';
import { isSettingsShape, validateSettings } from '@/lib/admin/settings';
import type { MenuData } from '@/lib/menu';

export const dynamic = 'force-dynamic';

type Body = {
  baseMenuSha?: string;
  baseSettingsSha?: string;
  menu?: MenuData;
  settings?: unknown;
  images?: { path: string; sha: string }[];
};

const IMAGE_PATH = /^public\/img\/u\/[a-z0-9-]+\.(webp|jpg|png)$/;
const SHA = /^[0-9a-f]{40}$/;

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('res' in auth) return auth.res;
  const { env } = auth;
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || typeof body.baseMenuSha !== 'string' || typeof body.baseSettingsSha !== 'string') return json({ error: 'Sorğu düzgün deyil.' }, 400);

  // Never trust the browser: validate everything again here.
  if (body.menu) {
    const errs = validateMenu(body.menu);
    if (errs.length) return json({ error: 'Menyuda səhvlər var.', details: errs.slice(0, 20) }, 422);
    if (JSON.stringify(Object.keys(body.menu)) !== JSON.stringify(['currency', 'categories', 'items'])) return json({ error: 'Menyu formatı düzgün deyil.' }, 422);
  }
  if (body.settings !== undefined) {
    if (!isSettingsShape(body.settings)) return json({ error: 'Ayarlar düzgün deyil.' }, 422);
    const errs = Object.values(validateSettings(body.settings));
    if (errs.length) return json({ error: 'Ayarlarda səhvlər var.', details: errs }, 422);
  }
  const images = body.images ?? [];
  if (images.length > 40 || images.some((i) => !IMAGE_PATH.test(i.path) || !SHA.test(i.sha))) return json({ error: 'Foto məlumatı düzgün deyil.' }, 422);

  try {
    const head = await headSha(env);
    const [curMenu, curSettings] = await Promise.all([readFile(env, MENU_PATH, head), readFile(env, SETTINGS_PATH, head)]);
    if (curMenu.sha !== body.baseMenuSha || curSettings.sha !== body.baseSettingsSha) {
      return json({ error: 'Menyu başqa yerdən dəyişdirilib. Səhifəni yeniləyin.' }, 409);
    }

    // The panel can't edit categories or the currency: always keep the ones already in the file.
    if (body.menu) {
      const cur = JSON.parse(curMenu.text) as MenuData;
      body.menu = { currency: cur.currency, categories: cur.categories, items: body.menu.items };
      const cats = new Set(cur.categories.map((c) => c.id));
      if (body.menu.items.some((i) => !cats.has(i.category))) return json({ error: 'Naməlum kateqoriya.' }, 422);
    }

    // The commit message is computed here from the real before/after, not taken from the browser.
    const changes = [
      ...(body.menu ? diffMenu(JSON.parse(curMenu.text), body.menu) : []),
      ...(body.settings ? diffSettings(JSON.parse(curSettings.text), body.settings as Record<string, unknown>) : []),
    ];
    const files: FileChange[] = [];
    const menuText = body.menu ? formatMenu(body.menu) : null;
    const settingsText = body.settings ? formatSettings(body.settings) : null;
    if (menuText !== null && menuText !== curMenu.text) files.push({ path: MENU_PATH, text: menuText });
    if (settingsText !== null && settingsText !== curSettings.text) files.push({ path: SETTINGS_PATH, text: settingsText });
    // photos only matter if the menu actually uses them
    const used = new Set(body.menu?.items.map((i) => i.image).filter(Boolean));
    for (const img of images) if (used.has('/' + img.path.replace(/^public\//, ''))) files.push({ path: img.path, blobSha: img.sha });

    if (!files.length || (!changes.length && files.every((f) => f.path.startsWith('public/')))) return json({ error: 'Yayımlanacaq dəyişiklik yoxdur.' }, 400);

    const { commitSha, blobs } = await commitFiles(env, {
      head,
      files,
      message: commitMessage(changes.length ? changes : ['menyu yeniləndi']),
      expect: {}, // shas were checked against `head` above; the ref update still refuses if the branch moved
    });
    return json({
      commitSha,
      menuSha: blobs[MENU_PATH] ?? curMenu.sha,
      settingsSha: blobs[SETTINGS_PATH] ?? curSettings.sha,
      changes,
    });
  } catch (e) {
    const f = friendlyError(e);
    return json({ error: f.error }, f.status);
  }
}
