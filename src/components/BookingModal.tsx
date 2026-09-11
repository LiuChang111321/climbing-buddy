'use client';

import { useState } from 'react';
import { formatDayLabel, toDateString, WEEKDAY_LABELS } from '@/lib/date';
import type { BookingInput, Gym } from '@/lib/types';

type Props = {
  gyms: Gym[];
  weekDates: Date[];
  initial?: BookingInput;
  defaultDate?: string;
  onSubmit: (input: BookingInput) => void;
  onClose: () => void;
  onDelete?: () => void;
};

export function BookingModal({
  gyms,
  weekDates,
  initial,
  defaultDate,
  onSubmit,
  onClose,
  onDelete,
}: Props) {
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? toDateString(weekDates[0]));
  const [time, setTime] = useState(initial?.time ?? '19:00');
  const [gymId, setGymId] = useState(initial?.gymId ?? gyms[0]?.id ?? 0);

  const canSubmit = time !== '' && gymId !== 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">{initial ? '修改报名 ✏️' : '我要去爬 🧗'}</h2>

        <label className="mt-4 block text-sm text-gray-500">日期</label>
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
        >
          {weekDates.map((d, i) => (
            <option key={toDateString(d)} value={toDateString(d)}>
              {WEEKDAY_LABELS[i]} {formatDayLabel(d)}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm text-gray-500">时间</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
        />

        <label className="mt-4 block text-sm text-gray-500">攀岩馆</label>
        <select
          value={gymId}
          onChange={(e) => setGymId(Number(e.target.value))}
          className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
        >
          {gyms.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onSubmit({ date, time, gymId })}
            disabled={!canSubmit}
            className="flex-1 rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 py-3 font-semibold text-white shadow-md shadow-sky-100 transition disabled:opacity-40"
          >
            确定
          </button>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-3 w-full rounded-xl border border-red-200 py-3 font-semibold text-red-600 transition hover:bg-red-50"
          >
            取消这次报名
          </button>
        )}
      </div>
    </div>
  );
}
