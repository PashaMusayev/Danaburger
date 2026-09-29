import catalogJson from '@/data/menu.json';
import branchesJson from '@/data/branches.json';
import gunesli from '@/data/branches/gunesli.json';
import narimanov from '@/data/branches/narimanov.json';
import mkr4 from '@/data/branches/4-mkr.json';
import { buildBranchMenu, type BranchInfo, type BranchMenu, type BranchMenuFile, type Catalog } from './menu';

export const catalog = catalogJson as Catalog;
export const branches = (branchesJson as { branches: BranchInfo[] }).branches;
export type BranchId = string;

// A new branch needs its data/branches/<id>.json imported here and an entry in data/branches.json.
const files: Record<string, BranchMenuFile> = { gunesli, narimanov, '4-mkr': mkr4 } as Record<string, BranchMenuFile>;

export const branchIds = branches.map((b) => b.id);
export const branchById = new Map(branches.map((b) => [b.id, b]));
export const DEFAULT_BRANCH = 'gunesli';

const cache = new Map<string, BranchMenu>();
export function getBranchMenu(id: string): BranchMenu {
  let m = cache.get(id);
  if (!m) {
    const file = files[id];
    if (!file) throw new Error(`Unknown branch: ${id}`);
    m = buildBranchMenu(catalog, file);
    cache.set(id, m);
  }
  return m;
}

export function getBranch(id: string): BranchInfo {
  const b = branchById.get(id);
  if (!b) throw new Error(`Unknown branch: ${id}`);
  return b;
}
