// Invite links carry the room code in the path and the join PIN in the URL
// fragment (/room/NOVA-07/add#pin=K7QX2M). Fragments never reach the server,
// so the PIN stays out of request logs and Referer headers.

export interface Invite {
  code: string;
  pin: string | null;
}

const CODE = /^[A-Za-z]+-\d{2}$/;
// Matches generate_join_pin() in plan.sql: no 0/O/1/I
const PIN = /^[A-HJ-NP-Z2-9]{6}$/;

// Uppercases and drops spaces/dashes people type between characters;
// null unless the result is a well-formed PIN
export function normalizePin(raw: string): string | null {
  const pin = raw.replace(/[\s-]/g, '').toUpperCase();
  return PIN.test(pin) ? pin : null;
}

export function readPinFromHash(hash: string): string | null {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('pin');
  return value ? normalizePin(value) : null;
}

export function buildInviteUrl(origin: string, code: string, pin: string): string {
  return `${origin}/room/${code.toUpperCase()}/add#pin=${pin}`;
}

// Reads a room code (and PIN, if present) from a scanned URL or a bare code
export function parseInvite(text: string): Invite | null {
  const trimmed = text.trim();
  // Full URL: https://karaokz.vercel.app/room/NOVA-07/add#pin=K7QX2M (or /room/NOVA-07)
  const urlMatch = trimmed.match(/\/room\/([A-Za-z]+-\d{2})(?:[/?][^#]*)?(#.*)?$/i);
  if (urlMatch) {
    return { code: urlMatch[1].toUpperCase(), pin: urlMatch[2] ? readPinFromHash(urlMatch[2]) : null };
  }
  // Bare code: NOVA-07
  if (CODE.test(trimmed)) return { code: trimmed.toUpperCase(), pin: null };
  return null;
}
