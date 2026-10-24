'use client';

import { useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Zap } from 'lucide-react';
import { getQuota, resetQuota, getQuotaLevel, DAILY_LIMIT } from '@/lib/quota';

function subscribe(onChange: () => void) {
  window.addEventListener('quota-updated', onChange);
  return () => window.removeEventListener('quota-updated', onChange);
}

export default function QuotaDisplay() {
  // null during server render; the count lives in this browser's localStorage
  const used = useSyncExternalStore(subscribe, () => getQuota().used, () => null);
  if (used === null) return null;

  const level = getQuotaLevel(used);
  const pct = Math.min((used / DAILY_LIMIT) * 100, 100);

  const colors = {
    ok:       'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10',
    warn:     'text-neon-orange border-neon-orange/30 bg-neon-orange/10',
    critical: 'text-destructive border-destructive/30 bg-destructive/10',
  };

  const barColors = {
    ok:       'bg-primary',
    warn:     'bg-neon-orange',
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
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs tabular-nums transition-colors ${colors[level]}`}
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
            className="text-[9px] text-destructive"
          >
            Quota nearly full — use URL tab
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
