'use client';

import Link from 'next/link';
import { formatDayLabel, isToday, toDateString, WEEKDAY_LABELS } from '@/lib/date';
import type { BookingRow } from '@/lib/types';

const GYM_COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
  'bg-lime-100 text-lime-700',
];

const AVATAR_BG = [
  'from-sky-200 to-cyan-100',
  'from-teal-200 to-emerald-100',
  'from-indigo-200 to-violet-100',
  'from-cyan-200 to-sky-100',
  'from-blue-200 to-indigo-100',
  'from-slate-200 to-blue-100',
  'from-violet-200 to-indigo-100',
  'from-emerald-200 to-teal-100',
];

const TIME_BUCKETS = [
  { label: '上午', emoji: '☀️', maxHour: 12 },
  { label: '下午', emoji: '🌤️', maxHour: 18 },
  { label: '晚上', emoji: '🌙', maxHour: 24 },
] as const;

function gymColor(gymName: string): string {
  let h = 0;
  for (let i = 0; i < gymName.length; i++) h = (h * 31 + gymName.charCodeAt(i)) >>> 0;
  return GYM_COLORS[h % GYM_COLORS.length] ?? 'bg-gray-100 text-gray-600';
}

function avatarBg(climberId: string): string {
  let h = 0;
  for (let i = 0; i < climberId.length; i++) h = (h * 31 + climberId.charCodeAt(i)) >>> 0;
  return AVATAR_BG[h % AVATAR_BG.length];
}

function bucketOf(time: string) {
  const hour = Number(time.split(':')[0]);
  return TIME_BUCKETS.find((b) => hour < b.maxHour) ?? TIME_BUCKETS[2];
}

function groupByBucket(bookings: BookingRow[]) {
  return TIME_BUCKETS.map((bucket) => {
    const items = bookings.filter((b) => bucketOf(b.time).label === bucket.label);
    const byGym = new Map<number, BookingRow[]>();
    for (const b of items) {
      const list = byGym.get(b.gymId) ?? [];
      list.push(b);
      byGym.set(b.gymId, list);
    }
    const gymGroups = [...byGym.entries()]
      .map(([gymId, list]) => ({
        gymId,
        gymName: list[0].gymName,
        items: [...list].sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .sort((a, b) => a.items[0].time.localeCompare(b.items[0].time));
    return { bucket, gymGroups };
  }).filter((g) => g.gymGroups.length > 0);
}

type Props = {
  weekDates: Date[];
  bookings: BookingRow[];
  currentUserId: string | null;
  onAdd: (date: string) => void;
  onEdit: (booking: BookingRow) => void;
};

export function WeekCalendar({ weekDates, bookings, currentUserId, onAdd, onEdit }: Props) {
  const days = weekDates.map((d, i) => {
    const dateStr = toDateString(d);
    return {
      key: dateStr,
      date: d,
      index: i,
      dateStr,
      today: isToday(d),
      groups: groupByBucket(bookings.filter((b) => b.date === dateStr)),
    };
  });

  return (
    <>
      {/* 移动端：竖排列表 */}
      <div className="mt-6 space-y-3 sm:hidden">
        {days.map((day) => (
          <div
            key={day.key}
            className={`rounded-2xl border-2 ${
              day.today ? 'border-sky-300 bg-sky-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-base font-bold ${day.today ? 'text-sky-600' : 'text-gray-800'}`}
                >
                  {WEEKDAY_LABELS[day.index]} {formatDayLabel(day.date)}
                </span>
                {day.today && (
                  <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white">
                    今天
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onAdd(day.dateStr)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-500 text-xl font-bold text-white shadow-md shadow-sky-100 transition-transform hover:scale-110"
                aria-label={`加入${WEEKDAY_LABELS[day.index]}`}
              >
                +
              </button>
            </div>

            {day.groups.length === 0 ? (
              <div className="px-4 pb-4 text-sm text-gray-300">还没人约 🧗</div>
            ) : (
              <div className="space-y-3 px-4 pb-4">
                {day.groups.map((g) => (
                  <div key={g.bucket.label}>
                    <div className="text-sm font-medium text-gray-400">
                      {g.bucket.emoji} {g.bucket.label}
                    </div>
                    <div className="mt-1.5 space-y-2">
                      {g.gymGroups.map((gg) => (
                        <div key={gg.gymId}>
                          <div className="mb-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${gymColor(
                                gg.gymName,
                              )}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {gg.gymName}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {gg.items.map((b) => {
                              const isMine =
                                currentUserId !== null && b.climberId === currentUserId;
                              const inner = (
                                <>
                                  <span className="text-2xl font-bold leading-none">{b.avatar}</span>
                                  <span className="text-sm font-medium text-gray-700">
                                    {b.nickname}
                                  </span>
                                  <span className="text-xs text-gray-400">{b.time}</span>
                                </>
                              );
                              return isMine ? (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => onEdit(b)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 py-1 pl-1.5 pr-2.5 ring-2 ring-sky-300"
                                >
                                  {inner}
                                </button>
                              ) : (
                                <Link
                                  key={b.id}
                                  href={`/climber/${b.climberId}`}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-white py-1 pl-1.5 pr-2.5 ring-1 ring-gray-100 transition hover:ring-sky-300"
                                >
                                  {inner}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 桌面端：7 列周历 */}
      <div className="-mx-4 mt-6 hidden overflow-x-auto px-4 pb-2 sm:block">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div
              key={day.key}
              className={`flex flex-col rounded-2xl border ${
                day.today
                  ? 'border-sky-300 bg-sky-50 shadow-md shadow-sky-100'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div
                className={`rounded-t-2xl py-2 text-center ${
                  day.today ? 'bg-gradient-to-b from-sky-400 to-sky-500 text-white' : ''
                }`}
              >
                <div className="text-xs">{WEEKDAY_LABELS[day.index]}</div>
                <div className="text-sm font-bold">{formatDayLabel(day.date)}</div>
              </div>

              <div className="flex-1 space-y-2 p-1.5">
                {day.groups.length === 0 && (
                  <div className="py-4 text-center text-xs text-gray-300">还没人约 🧗</div>
                )}
                {day.groups.map((g) => (
                  <div key={g.bucket.label}>
                    <div className="text-center text-[10px] font-medium text-gray-400">
                      {g.bucket.emoji} {g.bucket.label}
                    </div>
                    <div className="mt-1 space-y-2">
                      {g.gymGroups.map((gg) => (
                        <div key={gg.gymId}>
                          <div className="text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${gymColor(
                                gg.gymName,
                              )}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {gg.gymName}
                            </span>
                          </div>
                          <div className="mt-1 space-y-1">
                            {gg.items.map((b) => {
                              const isMine =
                                currentUserId !== null && b.climberId === currentUserId;
                              const inner = (
                                <>
                                  <div
                                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-bold shadow-sm ring-2 ring-white ${avatarBg(
                                      b.climberId,
                                    )}`}
                                  >
                                    {b.avatar}
                                  </div>
                                  <div className="mt-0.5 truncate text-xs font-medium text-gray-800">
                                    {b.nickname}
                                  </div>
                                  <div className="mt-0.5 text-[10px] text-gray-500">{b.time}</div>
                                </>
                              );

                              return isMine ? (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => onEdit(b)}
                                  className="block w-full rounded-xl bg-sky-50 p-1.5 text-center ring-2 ring-sky-300"
                                >
                                  {inner}
                                </button>
                              ) : (
                                <Link
                                  key={b.id}
                                  href={`/climber/${b.climberId}`}
                                  className="block rounded-xl bg-white p-1.5 text-center ring-1 ring-gray-100 transition hover:ring-sky-300"
                                >
                                  {inner}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-1.5 pt-0">
                <button
                  type="button"
                  onClick={() => onAdd(day.dateStr)}
                  className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-500 text-xl font-bold text-white shadow-md shadow-sky-100 transition-transform hover:rotate-90 hover:scale-110"
                  aria-label={`加入${WEEKDAY_LABELS[day.index]}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
