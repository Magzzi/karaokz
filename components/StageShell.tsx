import type { ReactNode } from 'react';
import BrandLogo from './BrandLogo';

interface StageShellProps {
  // Thumbnail of the current song, blurred into the background
  backdrop?: string | null;
  actions?: ReactNode;
  library: ReactNode;
  stage: ReactNode;
  side: ReactNode;
  controls: ReactNode;
}

// Three-column karaoke stage: song library | player | now singing + queue,
// with the control deck pinned underneath. Stacks on small screens.
export default function StageShell({ backdrop, actions, library, stage, side, controls }: StageShellProps) {
  return (
    <div className="relative isolate min-h-dvh lg:h-dvh flex flex-col overflow-x-hidden lg:overflow-hidden">
      <StageBackdrop image={backdrop} />

      <header className="shrink-0 px-4 lg:px-5 pt-4 pb-3 flex items-center justify-between gap-3">
        <BrandLogo />
        <div className="flex items-center gap-2">{actions}</div>
      </header>

      <main className="flex-1 min-h-0 px-4 lg:px-5 pb-3 grid gap-4 grid-cols-1 lg:grid-cols-[minmax(280px,340px)_1fr_minmax(300px,370px)]">
        <section className="order-1 lg:order-2 min-h-0 flex flex-col gap-4">{stage}</section>
        <aside className="order-2 lg:order-3 min-h-0 flex flex-col gap-4">{side}</aside>
        <aside className="order-3 lg:order-1 min-h-[28rem] lg:min-h-0 flex flex-col">{library}</aside>
      </main>

      <footer className="shrink-0 px-4 lg:px-5 pb-4 sticky bottom-0 z-20 lg:static">{controls}</footer>
    </div>
  );
}

export function StageBackdrop({ image }: { image?: string | null }) {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={image}
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover scale-125 blur-3xl opacity-30 animate-in fade-in duration-1000"
        />
      )}
      <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-neon-violet/25 blur-[120px]" />
      <div className="absolute top-1/3 -right-48 h-[34rem] w-[34rem] rounded-full bg-neon-pink/20 blur-[130px]" />
      <div className="absolute -bottom-48 left-1/4 h-[30rem] w-[40rem] rounded-full bg-neon-cyan/15 blur-[130px]" />
      {/* Faint stage floor lines */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-[0.07] [background-image:linear-gradient(rgb(130_150_255)_1px,transparent_1px),linear-gradient(90deg,rgb(130_150_255)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_top,black,transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />
    </div>
  );
}
