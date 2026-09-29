import { notFound } from 'next/navigation';
import { branchById, branchIds } from '@/lib/branches';
import { StoreProvider } from '@/lib/store';
import { BranchJsonLd } from '@/components/JsonLd';

// Only the branches in data/branches.json exist; anything else is a 404 (nothing renders on demand).
export const dynamicParams = false;
export const generateStaticParams = () => branchIds.map((branch) => ({ branch }));

export default async function BranchLayout({ children, params }: { children: React.ReactNode; params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  if (!branchById.has(branch)) notFound();
  return (
    <StoreProvider branch={branch}>
      <BranchJsonLd branch={branch} />
      {children}
    </StoreProvider>
  );
}
