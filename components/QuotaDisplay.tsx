'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Zap } from 'lucide-react';
import { getQuota, resetQuota, getQuotaLevel, DAILY_LIMIT } from '@/lib/quota';

export default function QuotaDisplay() {
  const [used, setUsed] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const refresh = () => setUsed(getQuota().used);
    refresh();
    setMounted(true);
    window.addEventListener('quota-updated', refresh);
    return () => window.removeEventListener('quota-updated', refresh);
  }, []);

  if (!mounted) return null;

  const level = getQuotaLevel(used);
  const pct = Math.min((used / DAILY_LIMIT) * 100, 100);

  const colors = {
    ok:       'text-primary border-primary/30 bg-primary/10',
    warn:     'text-accent border-accent/30 bg-accent/10',
    critical: 'text-destructive border-destructive/30 bg-destructive/10',
  };

  const barColors = {
    ok:       'bg-primary',
    warn:     'bg-accent',
    critical: 'bg-destructive',
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {/* Pill */}
      <motion.button
        onClick={() => {
          if (confirm('Reset quota counter? This only resets your local estimate, not Google\'s actual count.')) {
            resetQuota();
          }
        }}
        title="YouTube API quota estimate — click to reset counter"
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px] transition-colors ${colors[level]}`}
        whileTap={{ scale: 0.95 }}
      >
        {level === 'ok'
          ? <Zap className="h-2.5 w-2.5" />
          : <AlertTriangle className="h-2.5 w-2.5" />
        }
        <span>{used.toLocaleString()}&nbsp;/&nbsp;{DAILY_LIMIT.toLocaleString()}</span>
      </motion.button>

      {/* Progress bar */}
      <div className="w-20 h-0.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColors[level]}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Warning banner — only at critical */}
      <AnimatePresence>
        {level === 'critical' && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[9px] text-destructive font-mono"
          >
            Quota nearly full — use URL tab
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
