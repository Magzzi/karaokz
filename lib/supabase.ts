import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// Room access is per user (RLS on room_members), so every browser signs in
// anonymously once; the session persists in localStorage across reloads.
let sessionPromise: Promise<void> | null = null;

export function ensureSession(): Promise<void> {
  sessionPromise ??= (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  })().catch(err => {
    sessionPromise = null; // let the next call retry
    throw err;
  });
  return sessionPromise;
}
