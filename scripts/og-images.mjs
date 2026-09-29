// Generates public/og-<branch>.jpg (1200×630 share images) from the hero photo.
//   node scripts/og-images.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const { branches } = JSON.parse(readFileSync('data/branches.json', 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

for (const b of branches) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#0b0b0b" stop-opacity=".95"/><stop offset=".6" stop-color="#0b0b0b" stop-opacity=".45"/><stop offset="1" stop-color="#0b0b0b" stop-opacity="0"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<text x="60" y="220" font-family="DejaVu Sans, Arial Black, sans-serif" font-weight="900" font-size="92" fill="#d7261e">DANA</text>
<text x="60" y="320" font-family="DejaVu Sans, Arial Black, sans-serif" font-weight="900" font-size="92" fill="#f29a1f">BURGER</text>
<text x="62" y="410" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="54" fill="#f6efe6">${esc(b.name.az)}</text>
<text x="62" y="470" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" fill="#a39e97">${b.hours.open} – ${b.hours.close} · Bakı</text>
</svg>`;
  await sharp('public/img/hero.webp').resize(1200, 630, { fit: 'cover' }).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 82 }).toFile(`public/og-${b.id}.jpg`);
  console.log(`public/og-${b.id}.jpg`);
}
