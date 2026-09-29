'use client';

const MAX_SIDE = 1200;
const TARGET_BYTES = 150 * 1024;

const toBlob = (c: HTMLCanvasElement, type: string, q: number) =>
  new Promise<Blob | null>((r) => c.toBlob(r, type, q));

const toDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(b);
  });

/**
 * Resize in the browser to ≤1200 px and ≤150 KB before upload. WebP when the browser can encode it;
 * Safari can't (toBlob silently returns PNG), so it falls back to JPEG.
 */
export async function resizeImage(file: File): Promise<{ dataUrl: string; ext: 'webp' | 'jpg'; bytes: number }> {
  if (!file.type.startsWith('image/')) throw new Error('Bu fayl şəkil deyil.');
  const bmp = await createImageBitmap(file);
  let scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const probe = await toBlob(Object.assign(document.createElement('canvas'), { width: 1, height: 1 }), 'image/webp', 0.8);
  const type = probe?.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // transparent PNGs → dark, like the site
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    for (const q of [0.82, 0.7, 0.58, 0.46]) {
      const blob = await toBlob(canvas, type, q);
      if (blob && blob.size <= TARGET_BYTES) {
        return { dataUrl: await toDataUrl(blob), ext: type === 'image/webp' ? 'webp' : 'jpg', bytes: blob.size };
      }
    }
    scale *= 0.8;
  }
  throw new Error('Şəkli kiçiltmək olmadı. Başqa şəkil seçin.');
}
