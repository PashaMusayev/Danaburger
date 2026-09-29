// One-off migration from the single-restaurant layout to branches:
//   data/menu.json (items with prices)  →  data/menu.json (catalog) + data/branches/gunesli.json
//   data/settings.json phone/whatsapp    →  data/branches.json
// Safe to re-run: it does nothing once data/menu.json is already a catalog.
//
//   node scripts/migrate-to-branches.mts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isLegacyMenu, splitLegacyMenu } from '../lib/admin/migrate.ts';
import { formatBranchMenu, formatCatalog, formatJson } from '../lib/admin/format.ts';

const menu = JSON.parse(readFileSync('data/menu.json', 'utf8'));
if (!isLegacyMenu(menu)) {
  console.log('data/menu.json is already a catalog; nothing to do.');
  process.exit(0);
}

const { catalog, branch } = splitLegacyMenu(menu);
mkdirSync('data/branches', { recursive: true });
writeFileSync('data/menu.json', formatCatalog(catalog));
writeFileSync('data/branches/gunesli.json', formatBranchMenu(branch));

const settings = JSON.parse(readFileSync('data/settings.json', 'utf8'));
const { phone = '', whatsapp = '', ...rest } = settings;
writeFileSync('data/settings.json', formatJson(rest));

if (!existsSync('data/branches.json')) {
  writeFileSync(
    'data/branches.json',
    formatJson({
      branches: [
        {
          id: 'gunesli',
          name: { az: 'Günəşli', ru: 'Гюнешли', en: 'Gunashli' },
          address: { az: 'Günəşli, Bakı', ru: 'Гюнешли, Баку', en: 'Gunashli, Baku' },
          geo: { lat: 40.374861, lng: 49.977472 },
          hours: { open: '11:00', close: '05:00' },
          phone,
          whatsapp,
        },
      ],
    }),
  );
}
console.log(`Migrated ${catalog.items.length} items → catalog + data/branches/gunesli.json`);
