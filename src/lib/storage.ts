import type { Identity } from './types';

const KEY = 'climb-buddy:identity';

export function loadIdentity(): Identity | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Identity;
    if (
      typeof parsed.id === 'string' &&
      typeof parsed.nickname === 'string' &&
      typeof parsed.avatar === 'string' &&
      typeof parsed.secret === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function persistIdentity(identity: Identity): void {
  window.localStorage.setItem(KEY, JSON.stringify(identity));
}
