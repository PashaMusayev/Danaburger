import type { BranchesFile, BranchMenuFile, Catalog } from '../menu';
import type { Settings } from '../config';
import { formatBranchMenu, formatCatalog, formatJson } from './format';

/** Everything the panel edits. Each part is its own file in the repository. */
export type AdminData = {
  catalog: Catalog;
  branches: BranchesFile;
  /** branch id → that branch's menu */
  menus: Record<string, BranchMenuFile>;
  settings: Settings;
};

export const CATALOG_PATH = 'data/menu.json';
export const BRANCHES_PATH = 'data/branches.json';
export const SETTINGS_PATH = 'data/settings.json';
export const menuPath = (branch: string) => `data/branches/${branch}.json`;
/** History and revert follow every file under data/. */
export const DATA_DIR = 'data';

export const branchIdsOf = (d: Pick<AdminData, 'branches'>) => d.branches.branches.map((b) => b.id);

/** path → file text, exactly as it would be committed. */
export function serialize(d: AdminData): Record<string, string> {
  return {
    [CATALOG_PATH]: formatCatalog(d.catalog),
    [BRANCHES_PATH]: formatJson(d.branches),
    [SETTINGS_PATH]: formatJson(d.settings),
    ...Object.fromEntries(Object.entries(d.menus).map(([id, m]) => [menuPath(id), formatBranchMenu(m)])),
  };
}

/** Every path the panel tracks for conflict checks. */
export const trackedPaths = (branchIds: string[]) => [CATALOG_PATH, BRANCHES_PATH, SETTINGS_PATH, ...branchIds.map(menuPath)];

export const branchName = (d: Pick<AdminData, 'branches'>, id: string) => d.branches.branches.find((b) => b.id === id)?.name.az ?? id;
