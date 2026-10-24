'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { YouTubeVideo } from '@/types/youtube';

// Favourite songs are kept per browser so they can be re-added without
// spending search quota.
const KEY = 'karaoke-favorites';
const EVENT = 'favorites-updated';

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

function parse(raw: string): YouTubeVideo[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => '[]');
  const favorites = useMemo(() => parse(raw), [raw]);

  const isFavorite = useCallback((id: string) => favorites.some(f => f.id === id), [favorites]);

  const toggleFavorite = useCallback((video: YouTubeVideo) => {
    const current = parse(readRaw());
    const next = current.some(f => f.id === video.id)
      ? current.filter(f => f.id !== video.id)
      : [video, ...current];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVENT));
    } catch {}
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
