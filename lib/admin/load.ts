import 'server-only';
import type { AdminEnv } from './env';
import { readFile, readFileMaybe } from './github';
import { BRANCHES_PATH, CATALOG_PATH, SETTINGS_PATH, menuPath, type AdminData } from './model';
import type { BranchesFile } from '../menu';

export type Loaded = { data: AdminData; shas: Record<string, string>; texts: Record<string, string> };

/** Every admin-edited file at `ref`, parsed, with blob shas for conflict checks. */
export async function loadData(env: AdminEnv, ref: string): Promise<Loaded> {
  const [catalog, branches, settings] = await Promise.all([readFile(env, CATALOG_PATH, ref), readFile(env, BRANCHES_PATH, ref), readFile(env, SETTINGS_PATH, ref)]);
  const ids = (JSON.parse(branches.text) as BranchesFile).branches.map((b) => b.id);
  const menus = await Promise.all(ids.map((id) => readFile(env, menuPath(id), ref)));
  const files = { [CATALOG_PATH]: catalog, [BRANCHES_PATH]: branches, [SETTINGS_PATH]: settings, ...Object.fromEntries(ids.map((id, i) => [menuPath(id), menus[i]])) };
  return {
    data: {
      catalog: JSON.parse(catalog.text),
      branches: JSON.parse(branches.text),
      settings: JSON.parse(settings.text),
      menus: Object.fromEntries(ids.map((id, i) => [id, JSON.parse(menus[i].text)])),
    },
    shas: Object.fromEntries(Object.entries(files).map(([p, f]) => [p, f.sha])),
    texts: Object.fromEntries(Object.entries(files).map(([p, f]) => [p, f.text])),
  };
}

/** The menus (catalog + branch menus) at an older commit, or null if that commit predates branches. */
export async function loadMenusAt(env: AdminEnv, ref: string, branchIds: string[]) {
  const catalog = await readFile(env, CATALOG_PATH, ref);
  const menus = await Promise.all(branchIds.map((id) => readFileMaybe(env, menuPath(id), ref)));
  if (menus.some((m) => !m)) return null;
  return { catalog: JSON.parse(catalog.text), menus: Object.fromEntries(branchIds.map((id, i) => [id, JSON.parse(menus[i]!.text)])) };
}
