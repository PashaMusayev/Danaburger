import { redirect } from 'next/navigation';
import LoginForm from '@/components/admin/LoginForm';
import { adminEnv } from '@/lib/admin/env';
import { isLoggedIn } from '@/lib/admin/server';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await isLoggedIn()) redirect('/admin/');
  const { missing } = adminEnv();
  return (
    <main className="grid min-h-svh place-items-center bg-ink px-4 text-cream">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <img src="/img/logo.webp" alt="" width={48} height={48} className="rounded-xl" />
          <div>
            <p className="text-lg font-black">
              <span className="text-red">Dana</span> <span className="text-gold">Burger</span>
            </p>
            <p className="text-sm text-mute">Admin panel</p>
          </div>
        </div>
        <LoginForm missing={missing} />
      </div>
    </main>
  );
}
