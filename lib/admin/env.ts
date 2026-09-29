import 'server-only';

export type AdminEnv = {
  passwordHash: string;
  sessionSecret: string;
  token: string;
  repo: string;
  branch: string;
  apiUrl: string;
};

/** Reads the admin env vars; `missing` lists what still needs to be set in Vercel. */
export function adminEnv(): { env: AdminEnv | null; missing: string[] } {
  const e = process.env;
  const missing: string[] = [];
  if (!e.ADMIN_PASSWORD_HASH) missing.push('ADMIN_PASSWORD_HASH');
  if (!e.SESSION_SECRET || e.SESSION_SECRET.length < 32) missing.push('SESSION_SECRET (ən az 32 simvol)');
  if (!e.GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
  if (!e.GITHUB_REPO || !/^[\w.-]+\/[\w.-]+$/.test(e.GITHUB_REPO)) missing.push('GITHUB_REPO (sahib/repo)');
  if (!e.GITHUB_BRANCH) missing.push('GITHUB_BRANCH');
  if (missing.length) return { env: null, missing };
  return {
    env: {
      passwordHash: e.ADMIN_PASSWORD_HASH!,
      sessionSecret: e.SESSION_SECRET!,
      token: e.GITHUB_TOKEN!,
      repo: e.GITHUB_REPO!,
      branch: e.GITHUB_BRANCH!,
      apiUrl: (e.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, ''),
    },
    missing,
  };
}
