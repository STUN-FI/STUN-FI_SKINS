'use client';

type BrandedLogoProps = {
  className?: string;
  size?: 'compact' | 'base' | 'lg';
};

export default function BrandedLogo({ className = '', size = 'base' }: BrandedLogoProps) {
  const baseClass = size === 'lg' ? 'text-2xl sm:text-4xl' : size === 'compact' ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-3xl';

  return (
    <div className={`flex ${size === 'compact' ? 'flex-nowrap' : 'flex-wrap'} items-center gap-2 font-black text-black ${baseClass} ${className}`.trim()}>
      <span className="whitespace-nowrap">STUN-FI</span>
      <span
        className={`${size === 'compact' ? 'whitespace-nowrap' : 'whitespace-normal sm:whitespace-nowrap'} uppercase text-[0.9em] sm:text-[1em] md:text-inherit`}
        style={{
          fontFamily: 'Brush Script MT, Courier New, cursive',
          letterSpacing: '0.18em',
          transform: 'skewX(-12deg)',
          textShadow: '2px 2px 0 rgba(0,0,0,0.14)',
        }}
      >
        SKINS
      </span>
    </div>
  );
}
