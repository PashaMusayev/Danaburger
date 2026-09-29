import type { Metadata } from 'next';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Deals from '@/components/Deals';
import Breakfast from '@/components/Breakfast';
import Menu from '@/components/Menu';
import WhyUs from '@/components/WhyUs';
import Gallery from '@/components/Gallery';
import Location from '@/components/Location';
import Footer from '@/components/Footer';
import BottomBar from '@/components/BottomBar';
import Sheets from '@/components/LazySheets';
import { menuQrSvg } from '@/lib/qr';
import { branchMetadata } from './meta';

// Built once per deploy; the admin panel triggers a new deploy on publish.
export const dynamic = 'force-static';

type Props = { params: Promise<{ branch: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return branchMetadata((await params).branch);
}

export default async function BranchPage({ params }: Props) {
  const { branch } = await params;
  const qr = await menuQrSvg(branch);
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Deals />
        <Breakfast />
        <Menu />
        <WhyUs />
        <Gallery />
        <Location />
      </main>
      <Footer qrSvg={qr} />
      <BottomBar />
      <Sheets />
    </>
  );
}
