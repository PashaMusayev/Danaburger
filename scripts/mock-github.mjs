// A tiny in-memory stand-in for the parts of the GitHub API the admin panel uses.
// Local development:  npm run admin:mock   (then run `next dev` with the env from .env.example)
// E2E tests start it automatically. Nothing here touches the real repository.
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const PORT = Number(process.env.MOCK_PORT || 4010);
const TOKEN = process.env.MOCK_TOKEN || 'mock-token';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const SEED = ['data/menu.json', 'data/settings.json', 'data/branches.json', ...readdirSync('data/branches').map((f) => `data/branches/${f}`)];

let blobs, trees, commits, head;

const sha1 = (b) => createHash('sha1').update(b).digest('hex');
const gitBlobSha = (buf) => sha1(Buffer.concat([Buffer.from(`blob ${buf.length}\0`), buf]));

function putBlob(buf) {
  const sha = gitBlobSha(buf);
  blobs.set(sha, buf);
  return sha;
}
function putTree(entries) {
  const sha = sha1(JSON.stringify([...entries].sort()));
  trees.set(sha, new Map(entries));
  return sha;
}
function putCommit(tree, parents, message) {
  const sha = sha1(randomBytes(16));
  commits.set(sha, { tree, parents, message, date: new Date().toISOString(), author: 'Dana Burger Owner' });
  return sha;
}

function reset() {
  blobs = new Map();
  trees = new Map();
  commits = new Map();
  const entries = SEED.map((p) => [p, putBlob(readFileSync(p))]);
  head = putCommit(putTree(entries), [], 'Initial menu');
}
reset();

const fileAt = (commitSha, path) => {
  const c = commits.get(commitSha);
  if (!c) return null;
  const blobSha = trees.get(c.tree).get(path);
  return blobSha ? { sha: blobSha, buf: blobs.get(blobSha) } : null;
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  // ---- test helpers (not part of GitHub) ----
  if (p === '/__mock/reset') return reset(), send(res, 200, { head });
  if (p === '/__mock/file') {
    const f = fileAt(head, url.searchParams.get('path'));
    return f ? send(res, 200, { text: f.buf.toString('utf8'), sha: f.sha }) : send(res, 404, {});
  }
  if (p === '/__mock/commits') {
    const out = [];
    for (let s = head; s; s = commits.get(s).parents[0]) out.push({ sha: s, message: commits.get(s).message, files: [...trees.get(commits.get(s).tree).keys()] });
    return send(res, 200, out);
  }
  if (p === '/__mock/external-change') {
    // simulate someone else editing the menu (for conflict tests)
    const f = fileAt(head, 'data/branches/gunesli.json');
    const text = f.buf.toString('utf8').replace('{"id": "merci", "price": 3.5,', '{"id": "merci", "price": 3.6,');
    const entries = new Map(trees.get(commits.get(head).tree));
    entries.set('data/branches/gunesli.json', putBlob(Buffer.from(text)));
    head = putCommit(putTree([...entries]), [head], 'External edit');
    return send(res, 200, { head });
  }

  if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(res, 401, { message: 'Bad credentials' });
  const m = p.match(/^\/repos\/[^/]+\/[^/]+(\/.*)$/);
  if (!m) return send(res, 404, { message: 'Not Found' });
  const r = m[1];

  try {
    if (req.method === 'GET' && r === `/git/ref/heads/${BRANCH}`) return send(res, 200, { object: { sha: head } });

    if (req.method === 'GET' && r.startsWith('/contents/')) {
      const path = decodeURIComponent(r.slice('/contents/'.length));
      const ref = url.searchParams.get('ref') || head;
      const commitSha = ref === BRANCH ? head : ref;
      const f = fileAt(commitSha, path);
      if (!f) return send(res, 404, { message: 'Not Found' });
      return send(res, 200, { sha: f.sha, encoding: 'base64', content: f.buf.toString('base64') });
    }

    if (req.method === 'POST' && r === '/git/blobs') {
      const b = await readBody(req);
      return send(res, 201, { sha: putBlob(Buffer.from(b.content, b.encoding === 'base64' ? 'base64' : 'utf8')) });
    }

    const cm = r.match(/^\/git\/commits\/([0-9a-f]{40})$/);
    if (req.method === 'GET' && cm) {
      const c = commits.get(cm[1]);
      return c ? send(res, 200, { sha: cm[1], tree: { sha: c.tree } }) : send(res, 404, { message: 'Not Found' });
    }

    if (req.method === 'POST' && r === '/git/trees') {
      const b = await readBody(req);
      const entries = new Map(trees.get(b.base_tree));
      for (const e of b.tree) {
        if (!blobs.has(e.sha)) return send(res, 422, { message: 'blob not found' });
        entries.set(e.path, e.sha);
      }
      return send(res, 201, { sha: putTree([...entries]) });
    }

    if (req.method === 'POST' && r === '/git/commits') {
      const b = await readBody(req);
      return send(res, 201, { sha: putCommit(b.tree, b.parents, b.message) });
    }

    if (req.method === 'PATCH' && r === `/git/refs/heads/${BRANCH}`) {
      const b = await readBody(req);
      const c = commits.get(b.sha);
      if (!c) return send(res, 422, { message: 'Object does not exist' });
      if (!b.force && c.parents[0] !== head) return send(res, 422, { message: 'Update is not a fast forward' });
      head = b.sha;
      return send(res, 200, { object: { sha: head } });
    }

    if (req.method === 'GET' && r === '/commits') {
      const path = url.searchParams.get('path');
      const limit = Number(url.searchParams.get('per_page') || 30);
      const out = [];
      // like GitHub: `path` may be a file or a directory
      const under = (sha) => {
        if (!sha) return '';
        const t = trees.get(commits.get(sha).tree);
        return JSON.stringify([...t].filter(([p]) => p === path || p.startsWith(path + '/')).sort());
      };
      for (let s = head; s && out.length < limit; s = commits.get(s).parents[0]) {
        const c = commits.get(s);
        const mine = under(s);
        const parent = under(c.parents[0]);
        if (mine !== parent) out.push({ sha: s, commit: { message: c.message, author: { name: c.author, date: c.date } } });
      }
      return send(res, 200, out);
    }

    send(res, 404, { message: 'Not Found' });
  } catch (e) {
    send(res, 500, { message: String(e) });
  }
}).listen(PORT, () => console.log(`mock GitHub on http://localhost:${PORT} (branch ${BRANCH})`));
