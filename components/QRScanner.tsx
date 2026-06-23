'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onResult: (text: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onResult, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }

        const { default: jsQR } = await import('jsqr');

        const tick = () => {
          if (cancelled || !videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx || video.readyState < video.HAVE_ENOUGH_DATA) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code?.data) {
            streamRef.current?.getTracks().forEach(t => t.stop());
            onResult(code.data);
            return;
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) setError('Camera access denied. Allow camera permissions in your browser settings and try again.');
      }
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <p className="text-white font-mono text-sm font-semibold">Scan Room QR Code</p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Camera / error */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {error ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center space-y-3 max-w-xs">
              <Camera className="h-10 w-10 mx-auto text-white/20" />
              <p className="text-sm font-mono text-white/60 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Hidden canvas for frame processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Loading overlay */}
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            )}

            {/* Viewfinder */}
            {ready && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 rounded-2xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom hint */}
      <div className="px-4 py-3 bg-black/80 shrink-0 text-center">
        <p className="text-[11px] font-mono text-white/40">
          Point camera at the QR code on the PC screen
        </p>
      </div>
    </div>
  );
}
