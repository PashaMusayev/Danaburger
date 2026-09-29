type Params = Record<string, string | number | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Meta Pixel standard events that match our actions; others go as custom events.
const pixelStandard: Record<string, string> = {
  call_click: 'Contact',
  whatsapp_click: 'Contact',
  whatsapp_order: 'Purchase',
  add_to_cart: 'AddToCart',
  directions_click: 'FindLocation',
};

export function track(event: string, params: Params = {}) {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', event, params);
  const std = pixelStandard[event];
  if (std) window.fbq?.('track', std, { ...params, currency: 'AZN' });
  else window.fbq?.('trackCustom', event, params);
  if (process.env.NODE_ENV !== 'production') console.debug('[track]', event, params);
}
