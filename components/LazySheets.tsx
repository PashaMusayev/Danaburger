'use client';

import dynamic from 'next/dynamic';
import { useStore } from '@/lib/store';

// The sheets aren't needed for the first paint; their code loads on the first tap.
const ProductSheet = dynamic(() => import('./ProductSheet'), { ssr: false });
const CartSheet = dynamic(() => import('./CartSheet'), { ssr: false });

export default function LazySheets() {
  const { sheetItem, cartOpen } = useStore();
  return (
    <>
      {sheetItem && <ProductSheet />}
      {cartOpen && <CartSheet />}
    </>
  );
}
