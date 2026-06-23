'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, X, Camera } from 'lucide-react';

interface QRScannerProps {
  onResult: (text: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onResult, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text: string) => {
            scanner.stop().catch(() => {});
            onResult(text);
          },
          () => {} // per-frame decode errors are normal — ignore
        )
        .then(() => setStarted(true))
        .catch(() => setError('Camera access denied. Allow camera permissions and try again.'));
    });

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
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
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Camera / error area */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center space-y-3">
              <Camera className="h-10 w-10 mx-auto text-white/30" />
              <p className="text-sm font-mono text-white/60">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* html5-qrcode mounts its video inside this div */}
            <div id="qr-reader" className="w-full h-full" />
            {!started && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
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
