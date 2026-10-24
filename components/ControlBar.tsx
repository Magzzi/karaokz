'use client';

import { ChevronsRight, Gauge, Mic, MicOff, Minus, Pause, Plus, Volume2 } from 'lucide-react';
import { useMicLevel } from '@/lib/useMicLevel';

interface ControlBarProps {
  hasSong: boolean;
  playing: boolean;
  onToggle: () => void;
  onNext: () => void;
  volume: number;
  onVolume: (v: number) => void;
  rate: number;
  onRate: (r: number) => void;
}

export const TEMPO_STEPS = [0.5, 0.75, 1, 1.25, 1.5];

export default function ControlBar({ hasSong, playing, onToggle, onNext, volume, onVolume, rate, onRate }: ControlBarProps) {
  const tempoIdx = Math.max(0, TEMPO_STEPS.indexOf(rate));

  return (
    <div className="panel !rounded-2xl p-2.5 grid gap-2.5 grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-stretch">
      <MicMeter />

      <DeckGroup icon={<Volume2 className="h-5 w-5 text-neon-violet" />} label="Volume" value={`${volume}`} valueClass="text-neon-violet" className="hidden lg:flex">
        <StepButton onClick={() => onVolume(Math.max(0, volume - 10))} label="Volume down"><Minus /></StepButton>
        <NeonSlider value={volume} min={0} max={100} step={1} color="var(--neon-violet)" onChange={onVolume} label="Volume" />
        <StepButton onClick={() => onVolume(Math.min(100, volume + 10))} label="Volume up"><Plus /></StepButton>
      </DeckGroup>

      <button
        onClick={onToggle}
        disabled={!hasSong}
        className="col-start-1 lg:col-start-auto row-start-1 lg:row-start-auto min-w-0 lg:min-w-[15rem] rounded-xl bg-gradient-to-b from-[#ff4f9d] to-[#e8146d] neon-pink-glow px-6 py-3.5 flex items-center justify-center gap-3 text-xl font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        {playing ? <Pause className="h-6 w-6 fill-white" /> : <Mic className="h-6 w-6" />}
        {playing ? 'Pause' : 'Start Singing'}
      </button>

      <DeckGroup
        icon={<Gauge className="h-5 w-5 text-neon-cyan" />}
        label="Tempo"
        value={`${rate.toFixed(2).replace(/0$/, '')}×`}
        valueClass="text-neon-cyan"
        className="hidden lg:flex"
      >
        <StepButton onClick={() => onRate(TEMPO_STEPS[Math.max(0, tempoIdx - 1)])} label="Slower"><Minus /></StepButton>
        <NeonSlider
          value={tempoIdx} min={0} max={TEMPO_STEPS.length - 1} step={1} color="var(--neon-cyan)"
          onChange={i => onRate(TEMPO_STEPS[i])} label="Tempo"
        />
        <StepButton onClick={() => onRate(TEMPO_STEPS[Math.min(TEMPO_STEPS.length - 1, tempoIdx + 1)])} label="Faster"><Plus /></StepButton>
      </DeckGroup>

      <button
        onClick={onNext}
        disabled={!hasSong}
        className="col-start-2 lg:col-start-auto row-start-1 lg:row-start-auto rounded-xl bg-gradient-to-b from-[#2ab8ff] to-[#0b84e8] px-6 py-3.5 flex items-center justify-center gap-1.5 text-xl font-semibold text-white shadow-[0_0_22px_rgb(31_184_255/0.4)] transition-transform active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        Next <ChevronsRight className="h-6 w-6" />
      </button>
    </div>
  );
}

function MicMeter() {
  const { status, level, start, stop } = useMicLevel();
  const on = status === 'on';
  const bars = 16;
  const lit = Math.round(level * bars);

  return (
    <button
      onClick={on ? stop : start}
      className="hidden lg:flex tile items-center gap-3 px-4 py-2 text-left hover:bg-white/[0.06] transition-colors min-w-0"
      title={on ? 'Turn mic meter off' : 'Check your mic level (nothing is recorded)'}
    >
      {on ? <Mic className="h-8 w-8 shrink-0 text-neon-green" /> : <MicOff className="h-8 w-8 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <p className={`font-semibold truncate ${on ? 'text-neon-green' : 'text-muted-foreground'}`}>
          {status === 'on' ? 'Mic Ready' : status === 'requesting' ? 'Allow mic…' : status === 'denied' ? 'Mic blocked' : 'Mic Check'}
        </p>
        <div className="mt-1.5 flex gap-[3px] h-4">
          {Array.from({ length: bars }, (_, i) => (
            <span
              key={i}
              className={`flex-1 max-w-2 rounded-[2px] transition-colors duration-75 ${
                i < lit ? (i < bars * 0.6 ? 'bg-neon-green' : i < bars * 0.8 ? 'bg-[#ffd23d]' : 'bg-neon-orange') : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </button>
  );
}

function DeckGroup({ icon, label, value, valueClass, className = '', children }: {
  icon: React.ReactNode; label: string; value: string; valueClass: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={`tile px-4 py-2 flex-col justify-center gap-1.5 min-w-0 ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <span>{label}</span>
        <span className={`font-semibold tabular-nums ${valueClass}`}>{value}</span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function StepButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="h-7 w-9 shrink-0 rounded-lg border border-white/15 bg-black/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-white/30 transition-colors [&_svg]:h-4 [&_svg]:w-4"
    >
      {children}
    </button>
  );
}

function NeonSlider({ value, min, max, step, color, onChange, label }: {
  value: number; min: number; max: number; step: number; color: string; onChange: (v: number) => void; label: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
      className="neon-range flex-1 min-w-0"
      style={{ '--range-color': color, '--pct': `${pct}%` } as React.CSSProperties}
    />
  );
}
