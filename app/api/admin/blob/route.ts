import { createBlob, friendlyError } from '@/lib/admin/github';
import { json, requireAdmin } from '@/lib/admin/server';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 600 * 1024; // the panel resizes to ~150 KB; this is a hard ceiling

function kind(b: Buffer): 'webp' | 'jpg' | 'png' | null {
  if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return 'png';
  return null;
}

/** Photos are uploaded one by one before publishing, so the publish request stays small. */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('res' in auth) return auth.res;
  const body = (await req.json().catch(() => ({}))) as { data?: unknown };
  if (typeof body.data !== 'string') return json({ error: 'Foto göndərilmədi.' }, 400);
  const bytes = Buffer.from(body.data, 'base64');
  if (bytes.length > MAX_BYTES) return json({ error: 'Foto çox böyükdür.' }, 413);
  const type = kind(bytes);
  if (!type) return json({ error: 'Yalnız JPG, PNG və ya WebP şəkil yükləmək olar.' }, 415);
  try {
    return json({ sha: await createBlob(auth.env, body.data), type });
  } catch (e) {
    const f = friendlyError(e);
    return json({ error: f.error }, f.status);
  }
}
