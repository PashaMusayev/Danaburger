import Image from 'next/image';

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <Image src="/img/logo.webp" alt="" width={size} height={size} className="rounded-lg" />
      <span className="leading-[0.85] font-black tracking-tight" style={{ fontSize: size * 0.5 }}>
        <span className="block text-red">Dana</span>{' '}
        <span className="block text-gold">Burger</span>
      </span>
    </span>
  );
}
