import type { BadgeDef } from './badges';
import type { BookingInput, BookingRow, Gym, Identity } from './types';

type MutationResult = { newBadges: BadgeDef[] };

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchGyms(): Promise<Gym[]> {
  return jsonFetch<Gym[]>('/api/gyms');
}

export function fetchBookings(start: string, end: string): Promise<BookingRow[]> {
  return jsonFetch<BookingRow[]>(`/api/bookings?start=${start}&end=${end}`);
}

export function createBooking(input: BookingInput & { climberId: string; secret: string }) {
  return jsonFetch<MutationResult>('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function updateBooking(id: number, input: BookingInput & { userId: string; secret: string }) {
  return jsonFetch<MutationResult>(`/api/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function deleteBooking(id: number, userId: string, secret: string) {
  return jsonFetch<MutationResult>(`/api/bookings/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, secret }),
  });
}

export function upsertClimber(identity: Identity) {
  return jsonFetch('/api/climbers', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(identity),
  });
}
