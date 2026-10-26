'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Check, Copy, X } from 'lucide-react';
import { buildInviteUrl } from '@/lib/invite';

export default function ShareRoomDialog({ code, pin, onClose }: { code: string; pin: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  // The link carries the PIN, so scanning joins in one step
  const joinUrl = buildInviteUrl(window.location.origin, code, pin);

  const copy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative glass rounded-3xl p-7 w-full max-w-sm text-center"
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        <p className="text-sm text-muted-foreground">Scan to add songs from your phone</p>
        <p className="mt-1 text-4xl font-black italic tracking-widest text-neon-pink neon-text-pink">
          {code.toUpperCase()}
        </p>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          PIN <span className="font-mono text-lg font-bold tracking-[0.3em] text-neon-cyan">{pin}</span>
        </p>

        <div className="inline-block rounded-2xl bg-white p-4 shadow-[0_0_40px_rgb(31_184_255/0.35)]">
          <QRCode value={joinUrl} size={196} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground break-all">{joinUrl}</p>
        <button onClick={copy} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-neon-cyan hover:text-neon-cyan/80">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground/60">
          Testing locally? Use your machine&apos;s LAN IP instead of localhost.
        </p>
      </motion.div>
    </div>
  );
}
