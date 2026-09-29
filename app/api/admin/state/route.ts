import { friendlyError, headSha, MENU_PATH, readFile, SETTINGS_PATH } from '@/lib/admin/github';
import { json, requireAdmin } from '@/lib/admin/server';

export const dynamic = 'force-dynamic';

/** The live menu + settings from GitHub (the source of truth), with the shas used for conflict checks. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('res' in auth) return auth.res;
  try {
    const head = await headSha(auth.env);
    const [menu, settings] = await Promise.all([readFile(auth.env, MENU_PATH, head), readFile(auth.env, SETTINGS_PATH, head)]);
    return json({ menu: JSON.parse(menu.text), menuSha: menu.sha, settings: JSON.parse(settings.text), settingsSha: settings.sha, head });
  } catch (e) {
    const f = friendlyError(e);
    return json({ error: f.error }, f.status);
  }
}
