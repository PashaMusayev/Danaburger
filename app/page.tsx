import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Deals from '@/components/Deals';
import Menu from '@/components/Menu';
import WhyUs from '@/components/WhyUs';
import Gallery from '@/components/Gallery';
import Location from '@/components/Location';
import Footer from '@/components/Footer';
import BottomBar from '@/components/BottomBar';
import Sheets from '@/components/LazySheets';
import { menuQrSvg } from '@/lib/qr';

export default async function Home() {
  const qr = await menuQrSvg();
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Deals />
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
