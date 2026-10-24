'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Hash, QrCode, X } from 'lucide-react';
import QRScanner from './QRScanner';

// Extracts a room code from a scanned URL or bare code string
function extractRoomCode(text: string): string | null {
  const trimmed = text.trim();
  // Full URL: https://karaokz.vercel.app/room/NOVA-07/add (or /room/NOVA-07)
  const urlMatch = trimmed.match(/\/room\/([A-Za-z]+-\d{2})/i);
  if (urlMatch) return urlMatch[1].toUpperCase();
  // Bare code: NOVA-07
  if (/^[A-Za-z]+-\d{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

interface JoinRoomDialogProps {
  onClose: () => void;
}

export default function JoinRoomDialog({ onClose }: JoinRoomDialogProps) {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (rawCode: string) => {
    if (!rawCode.trim()) return;
    router.push(`/room/${rawCode.trim().toUpperCase()}/add`);
  };

  const handleScanResult = (text: string) => {
    const code = extractRoomCode(text);
    if (code) {
      handleJoin(code);
    } else {
      setScanning(false);
      setError("Couldn't read a room code from the QR. Enter it manually below.");
    }
  };

  // QR scanner takes the full screen
  if (scanning) {
    return <QRScanner onResult={handleScanResult} onClose={() => setScanning(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div
        className="relative glass rounded-3xl p-7 w-full max-w-sm border border-border/50 z-10"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-neon-pink/15 border border-neon-pink/40 flex items-center justify-center shrink-0">
            <Hash className="h-5 w-5 text-neon-pink" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-lg">Join a Room</h2>
            <p className="text-sm text-muted-foreground">Enter the room code or scan the QR</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Code input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleJoin(codeInput); }}
            className="flex gap-2"
          >
            <Input
              autoFocus
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setError(null); }}
              placeholder="e.g. NOVA-07"
              className="flex-1 bg-black/25 border-white/10 text-base h-12 rounded-xl uppercase tracking-widest"
              maxLength={10}
            />
            <Button
              type="submit"
              disabled={!codeInput.trim()}
              className="h-12 rounded-xl px-5 text-base font-semibold text-white bg-gradient-to-b from-[#2ab8ff] to-[#0b84e8]"
            >
              Join
            </Button>
          </form>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-sm text-muted-foreground">or</span>
            </div>
          </div>

          {/* Scan button */}
          <Button
            onClick={() => setScanning(true)}
            variant="outline"
            className="w-full h-12 rounded-xl text-base border-white/10 bg-white/5 gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          >
            <QrCode className="h-4 w-4" />
            Scan QR Code
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
