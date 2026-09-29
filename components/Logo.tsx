import Image from 'next/image';

/** `compact` hides the wordmark on phones, leaving room for the branch switcher. */
export default function Logo({ size = 40, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Image src="/img/logo.webp" alt="" width={size} height={size} className="rounded-lg" />
      <span className={`leading-[0.85] font-black tracking-tight ${compact ? 'hidden sm:block' : ''}`} style={{ fontSize: size * 0.5 }}>
        <span className="block text-red">Dana</span>{' '}
        <span className="block text-gold">Burger</span>
      </span>
    </span>
  );
}
