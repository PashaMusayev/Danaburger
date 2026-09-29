import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { isLoggedIn } from '@/lib/admin/server';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isLoggedIn())) redirect('/admin/login/');
  return <AdminShell>{children}</AdminShell>;
}
