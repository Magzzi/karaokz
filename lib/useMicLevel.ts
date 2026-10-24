'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type MicStatus = 'off' | 'requesting' | 'on' | 'denied';

// Live microphone input level (0..1) for the "mic ready" meter.
// Nothing is recorded or played back; the stream only feeds an analyser.
export function useMicLevel() {
  const [status, setStatus] = useState<MicStatus>('off');
  const [level, setLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setLevel(0);
    setStatus('off');
  }, []);

  const start = useCallback(async () => {
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream;
      ctxRef.current = ctx;
      setStatus('on');

      const samples = new Uint8Array(analyser.fftSize);
      let last = 0;
      const tick = (now: number) => {
        rafRef.current = requestAnimationFrame(tick);
        if (now - last < 50) return; // ~20 updates/s is plenty for a meter
        last = now;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const s of samples) {
          const v = (s - 128) / 128;
          sum += v * v;
        }
        // RMS of speech/singing sits well below 0.5; scale so it fills the meter
        setLevel(Math.min(1, Math.sqrt(sum / samples.length) * 4));
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setStatus('denied');
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { status, level, start, stop };
}
