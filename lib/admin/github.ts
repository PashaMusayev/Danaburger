import 'server-only';
import type { AdminEnv } from './env';

import { DATA_DIR } from './model';

/** Someone else changed the file since the panel loaded it. Never overwrite: the owner reloads. */
export class ConflictError extends Error {}
export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Json = Record<string, unknown>;

async function gh<T = Json>(env: AdminEnv, path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}/repos/${env.repo}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${env.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new GitHubError(0, 'GitHub-a qoşulmaq olmadı. İnterneti yoxlayıb yenidən cəhd edin.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new GitHubError(res.status, text.slice(0, 300));
  }
  return (await res.json()) as T;
}

const enc = (p: string) => p.split('/').map(encodeURIComponent).join('/');

/** File text + blob sha at a branch or commit. */
export async function readFile(env: AdminEnv, path: string, ref: string): Promise<{ text: string; sha: string }> {
  const r = await gh<{ content: string; sha: string; encoding: string }>(env, `/contents/${enc(path)}?ref=${encodeURIComponent(ref)}`);
  return { text: Buffer.from(r.content, 'base64').toString('utf8'), sha: r.sha };
}

/** Like readFile, but null when the file doesn't exist at that ref (e.g. a commit from before branches). */
export async function readFileMaybe(env: AdminEnv, path: string, ref: string): Promise<{ text: string; sha: string } | null> {
  try {
    return await readFile(env, path, ref);
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}

export async function headSha(env: AdminEnv): Promise<string> {
  const r = await gh<{ object: { sha: string } }>(env, `/git/ref/heads/${enc(env.branch)}`);
  return r.object.sha;
}

export async function createBlob(env: AdminEnv, base64: string): Promise<string> {
  const r = await gh<{ sha: string }>(env, '/git/blobs', { method: 'POST', body: { content: base64, encoding: 'base64' } });
  return r.sha;
}

export type FileChange = { path: string; text?: string; blobSha?: string };

/**
 * One commit with every change (menu, settings, photos). `expect` maps paths to the blob sha the panel
 * loaded; if any of them moved on, or the branch moves while we're writing, we refuse with ConflictError.
 */
export async function commitFiles(
  env: AdminEnv,
  opts: { files: FileChange[]; message: string; expect: Record<string, string>; head?: string },
): Promise<{ commitSha: string; blobs: Record<string, string> }> {
  const head = opts.head ?? (await headSha(env));
  for (const [path, sha] of Object.entries(opts.expect)) {
    const cur = await readFile(env, path, head);
    if (cur.sha !== sha) throw new ConflictError(path);
  }
  const commit = await gh<{ tree: { sha: string } }>(env, `/git/commits/${head}`);
  const blobs: Record<string, string> = {};
  const tree = await Promise.all(
    opts.files.map(async (f) => {
      const sha = f.blobSha ?? (await createBlob(env, Buffer.from(f.text ?? '', 'utf8').toString('base64')));
      blobs[f.path] = sha;
      return { path: f.path, mode: '100644', type: 'blob', sha };
    }),
  );
  const newTree = await gh<{ sha: string }>(env, '/git/trees', { method: 'POST', body: { base_tree: commit.tree.sha, tree } });
  const newCommit = await gh<{ sha: string }>(env, '/git/commits', {
    method: 'POST',
    body: { message: opts.message, tree: newTree.sha, parents: [head] },
  });
  try {
    // force: false → GitHub rejects the update if the branch moved after we read `head`
    await gh(env, `/git/refs/heads/${enc(env.branch)}`, { method: 'PATCH', body: { sha: newCommit.sha, force: false } });
  } catch (e) {
    if (e instanceof GitHubError && e.status === 422) throw new ConflictError('branch');
    throw e;
  }
  return { commitSha: newCommit.sha, blobs };
}

export type HistoryEntry = { sha: string; message: string; date: string; author: string };

/** Commits that touched anything under data/ (menus, prices, branch info, settings). */
export async function menuHistory(env: AdminEnv, limit = 30): Promise<HistoryEntry[]> {
  const r = await gh<{ sha: string; commit: { message: string; author: { name: string; date: string } } }[]>(
    env,
    `/commits?sha=${encodeURIComponent(env.branch)}&path=${encodeURIComponent(DATA_DIR)}&per_page=${limit}`,
  );
  return r.map((c) => ({ sha: c.sha, message: c.commit.message, date: c.commit.author.date, author: c.commit.author.name }));
}

/** Turn GitHub failures into something the owner can act on. */
export function friendlyError(e: unknown): { status: number; error: string } {
  if (e instanceof ConflictError) return { status: 409, error: 'Menyu başqa yerdən dəyişdirilib. Səhifəni yeniləyin.' };
  if (e instanceof GitHubError) {
    if (e.status === 0) return { status: 502, error: e.message };
    if (e.status === 401 || e.status === 403) return { status: 502, error: 'GitHub açarı (token) işləmir və ya icazəsi çatmır. Developerə xəbər verin.' };
    if (e.status === 404) return { status: 502, error: 'Repozitoriya və ya branch tapılmadı. Developerə xəbər verin.' };
    return { status: 502, error: 'GitHub xətası baş verdi. Bir az sonra yenidən cəhd edin.' };
  }
  return { status: 500, error: 'Gözlənilməz xəta. Yenidən cəhd edin.' };
}
