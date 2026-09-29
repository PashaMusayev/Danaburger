// Built once per deploy. After publishing, the admin panel polls this until the sha matches its
// commit and then shows "Saytda canlıdır ✓" — no Vercel API token needed.
export const dynamic = 'force-static';

export function GET() {
  return Response.json({ sha: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local', builtAt: new Date().toISOString() });
}
