'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookingModal } from '@/components/BookingModal';
import { IdentityDialog } from '@/components/IdentityDialog';
import { WeekCalendar } from '@/components/WeekCalendar';
import {
  createBooking,
  deleteBooking,
  fetchBookings,
  fetchGyms,
  updateBooking,
  upsertClimber,
} from '@/lib/api';
import { formatDayLabel, getWeekDates, toDateString } from '@/lib/date';
import { loadIdentity, persistIdentity } from '@/lib/storage';
import type { BadgeDef, BookingInput, BookingRow, Gym, Identity } from '@/lib/types';

type ModalState =
  | { mode: 'create'; defaultDate?: string }
  | { mode: 'edit'; booking: BookingRow }
  | null;

export default function Home() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [ready, setReady] = useState(false);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState<Date>(() => new Date());
  const [modal, setModal] = useState<ModalState>(null);
  const [showIdentity, setShowIdentity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeToast, setBadgeToast] = useState<BadgeDef[] | null>(null);

  const weekDates = useMemo(() => {
    const base = new Date(now);
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(base);
  }, [now, weekOffset]);

  const startStr = toDateString(weekDates[0]);
  const endStr = toDateString(weekDates[6]);

  useEffect(() => {
    const stored = loadIdentity();
    setIdentity(stored);
    setReady(true);
    if (stored) upsertClimber(stored).catch(() => {});
  }, []);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  const refresh = useCallback(async () => {
    const [gymsData, bookingsData] = await Promise.all([
      fetchGyms(),
      fetchBookings(startStr, endStr),
    ]);
    setGyms(gymsData);
    setBookings(bookingsData);
  }, [startStr, endStr]);

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [refresh]);

  useEffect(() => {
    if (!badgeToast) return;
    const id = setTimeout(() => setBadgeToast(null), 3500);
    return () => clearTimeout(id);
  }, [badgeToast]);

  const handleConfirmIdentity = async (nickname: string, avatar: string, signature: string) => {
    const newIdentity: Identity = identity
      ? { ...identity, nickname, avatar, signature }
      : { id: crypto.randomUUID(), secret: crypto.randomUUID(), nickname, avatar, signature };
    persistIdentity(newIdentity);
    setIdentity(newIdentity);
    setShowIdentity(false);
    try {
      await upsertClimber(newIdentity);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSubmitBooking = async (input: BookingInput) => {
    if (!identity) return;
    try {
      let result: { newBadges: BadgeDef[] };
      if (modal?.mode === 'edit') {
        result = await updateBooking(modal.booking.id, { ...input, userId: identity.id, secret: identity.secret });
      } else {
        result = await createBooking({ ...input, climberId: identity.id, secret: identity.secret });
      }
      setModal(null);
      if (result.newBadges.length > 0) setBadgeToast(result.newBadges);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteBooking = async (booking: BookingRow) => {
    if (!identity) return;
    try {
      const result = await deleteBooking(booking.id, identity.id, identity.secret);
      setModal(null);
      if (result.newBadges.length > 0) setBadgeToast(result.newBadges);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAddForDate = (date: string) => {
    if (!identity) {
      setShowIdentity(true);
      return;
    }
    setModal({ mode: 'create', defaultDate: date });
  };

  const shiftWeek = (delta: number) => setWeekOffset((o) => o + delta);
  const goThisWeek = () => setWeekOffset(0);

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">今天去哪爬!!!</h1>
          {identity && (
            <Link
              href={`/climber/${identity.id}`}
              className="flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3.5 py-2 text-sm font-bold text-white shadow-sm shadow-amber-100 transition hover:brightness-105"
            >
              🏅 勋章
            </Link>
          )}
        </div>
        {identity && (
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Link
              href={`/climber/${identity.id}`}
              className="flex items-center gap-1 font-medium text-gray-600 transition hover:text-sky-600"
            >
              {identity.avatar} {identity.nickname}
            </Link>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              onClick={() => setShowIdentity(true)}
              className="text-gray-400 transition hover:text-sky-600"
            >
              编辑
            </button>
          </div>
        )}
      </header>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-500 transition hover:border-sky-300 hover:text-sky-600"
          aria-label="上一周"
        >
          ‹
        </button>
        <div className="min-w-[120px] text-center text-sm font-medium text-gray-700">
          {formatDayLabel(weekDates[0])} – {formatDayLabel(weekDates[6])}
        </div>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-500 transition hover:border-sky-300 hover:text-sky-600"
          aria-label="下一周"
        >
          ›
        </button>
        {weekOffset !== 0 && (
          <button
            type="button"
            onClick={goThisWeek}
            className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-600"
          >
            回本周
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <WeekCalendar
        weekDates={weekDates}
        bookings={bookings}
        currentUserId={identity?.id ?? null}
        onAdd={handleAddForDate}
        onEdit={(b) => setModal({ mode: 'edit', booking: b })}
      />

      {(showIdentity || !identity) && (
        <IdentityDialog
          initial={identity ?? undefined}
          onConfirm={handleConfirmIdentity}
          onClose={identity ? () => setShowIdentity(false) : undefined}
        />
      )}

      {modal && (
        <BookingModal
          gyms={gyms}
          weekDates={weekDates}
          initial={
            modal.mode === 'edit'
              ? { date: modal.booking.date, time: modal.booking.time, gymId: modal.booking.gymId }
              : undefined
          }
          defaultDate={modal.mode === 'create' ? modal.defaultDate : undefined}
          onSubmit={handleSubmitBooking}
          onClose={() => setModal(null)}
          onDelete={
            modal.mode === 'edit' ? () => handleDeleteBooking(modal.booking) : undefined
          }
        />
      )}

      {badgeToast && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setBadgeToast(null)}
        >
          <div className="animate-[badge-pop_0.45s_cubic-bezier(0.34,1.56,0.64,1)] w-full max-w-xs rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 p-[2px] shadow-2xl">
            <div className="rounded-3xl bg-gray-900 px-6 py-6 text-center text-white">
              <div className="text-4xl">🎉</div>
              <div className="mt-2 text-base font-bold">解锁新称号</div>
              <div className="mt-3 flex flex-col items-center gap-2">
                {badgeToast.map((b) => (
                  <div key={b.id} className="flex items-center gap-2">
                    <span className="text-3xl">{b.emoji}</span>
                    <span className="text-lg font-bold text-amber-300">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
