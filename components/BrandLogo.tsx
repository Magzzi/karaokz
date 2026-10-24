import { Music2 } from 'lucide-react';

export default function BrandLogo({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const big = size === 'lg';
  return (
    <div className="leading-none select-none">
      <div className={`flex items-center font-black italic tracking-tight ${big ? 'text-2xl sm:text-4xl' : 'text-xl'}`}>
        <span className="text-white drop-shadow-[0_2px_8px_rgb(255_255_255/0.25)]">Kara</span>
        <span className="neon-text-pink bg-gradient-to-r from-[#ff2d87] via-[#ff4fa0] to-[#ff7ac0] bg-clip-text text-transparent pr-1">
          OKZ
        </span>
        <Music2 className={`text-neon-pink neon-text-pink -rotate-6 ${big ? 'h-5 w-5 sm:h-7 sm:w-7' : 'h-4 w-4'}`} strokeWidth={2.5} />
      </div>
      {big && (
        <p className="mt-1.5 hidden sm:block whitespace-nowrap text-[10px] font-medium tracking-[0.38em] text-neon-cyan/80">
          SING · PLAY · GOOD VIBES
        </p>
      )}
    </div>
  );
}
