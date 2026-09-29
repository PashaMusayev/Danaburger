import type { Metadata } from 'next';
import Header from '@/components/Header';
import Menu from '@/components/Menu';
import OpenBadge from '@/components/OpenBadge';
import BottomBar from '@/components/BottomBar';
import Sheets from '@/components/LazySheets';

// Public pages are built once per deploy; the admin panel triggers a new deploy on publish.
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Menyu — Dana Burger',
  description: 'Dana Burger menyusu: burgerlər, şaurma, izqara, pizza, pide, setlər və içkilər. Qiymətlər AZN ilə.',
  alternates: { canonical: '/menu/' },
};

// Target of the table QR codes: straight to the menu, no hero.
export default function MenuPage() {
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
