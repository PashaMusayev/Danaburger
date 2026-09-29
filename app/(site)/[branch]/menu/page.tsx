import type { Metadata } from 'next';
import Header from '@/components/Header';
import Menu from '@/components/Menu';
import OpenBadge from '@/components/OpenBadge';
import BottomBar from '@/components/BottomBar';
import Sheets from '@/components/LazySheets';
import { branchMetadata } from '../meta';

export const dynamic = 'force-static';

type Props = { params: Promise<{ branch: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return branchMetadata((await params).branch, 'Menyu');
}

// Target of the branch's table QR codes: straight to the menu, no hero.
export default function BranchMenuPage() {
  return (
    <>
      <Header />
      <main>
        <div className="mx-auto max-w-6xl px-4 pt-5">
          <OpenBadge />
        </div>
        <Menu standalone />
      </main>
      <BottomBar />
      <Sheets />
    </>
  );
}
