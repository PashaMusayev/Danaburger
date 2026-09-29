import Script from 'next/script';
import { config } from '@/lib/config';
import { StoreProvider } from '@/lib/store';
import JsonLd from '@/components/JsonLd';

// Public site only: the admin panel gets neither the cart store, JSON-LD nor analytics
// (the owner's own visits would otherwise count in GA4 / Meta Pixel).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { ga4Id, metaPixelId } = config.analytics;
  return (
    <>
      <JsonLd />
      <StoreProvider>{children}</StoreProvider>

      {ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga4Id}');`}
          </Script>
        </>
      )}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
