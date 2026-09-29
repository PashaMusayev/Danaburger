import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BranchPicker from '@/components/BranchPicker';
import WhyUs from '@/components/WhyUs';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import { OrganizationJsonLd } from '@/components/JsonLd';
import { StoreProvider } from '@/lib/store';

export const dynamic = 'force-static';

// Brand home page: short hero, then the three branches. Prices and the deals carousel live on
// the branch pages, because they differ per branch (see README → "Filiallar").
export default function Home() {
  return (
    <StoreProvider>
      <OrganizationJsonLd />
      <Header />
      <main>
        <Hero />
        <BranchPicker />
        <WhyUs />
        <Gallery />
      </main>
      <Footer />
    </StoreProvider>
  );
}
