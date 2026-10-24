'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createRoom } from '@/lib/rooms';
import { Users, Loader2, X } from 'lucide-react';

interface CreateRoomDialogProps {
  onClose: () => void;
}

export default function CreateRoomDialog({ onClose }: CreateRoomDialogProps) {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const room = await createRoom(hostName.trim());
      router.push(`/room/${room.code}`);
    } catch {
      setError('Failed to create room. Check your Supabase connection.');
      setLoading(false);
    }
  };

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
            <Users className="h-5 w-5 text-neon-pink" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-lg">Create Karaoke Room</h2>
            <p className="text-sm text-muted-foreground">
              Guests add songs from their phone
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Your Name (Host)
            </label>
            <Input
              autoFocus
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g. John Doe"
              className="mt-1.5 bg-black/25 border-white/10 text-base h-12 rounded-xl"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!hostName.trim() || loading}
            className="w-full h-12 rounded-xl text-base font-semibold text-white bg-gradient-to-b from-[#ff4f9d] to-[#e8146d] neon-pink-glow hover:opacity-95"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : 'Create Room →'
            }
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
