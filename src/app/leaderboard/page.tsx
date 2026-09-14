import Link from 'next/link';
import { computeLeaderboard, type RangeKey, type RankEntry } from '@/lib/leaderboard';
import { db } from '@/lib/db';
import { bookings, climbers } from '@/lib/db/schema';

const RANGE_TABS: { key: RangeKey; label: string }[] = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '总榜' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

const TITLE_CHIP: Record<string, string> = {
  tryhard: 'bg-amber-100 text-amber-700',
  explorer: 'bg-sky-100 text-sky-700',
  night_owl: 'bg-indigo-100 text-indigo-700',
  early_bird: 'bg-orange-100 text-orange-700',
  regular: 'bg-rose-100 text-rose-700',
  rising: 'bg-emerald-100 text-emerald-700',
  rookie: 'bg-cyan-100 text-cyan-700',
  checkin: 'bg-slate-100 text-slate-600',
  couch: 'bg-gray-100 text-gray-400',
};

function TitleCard({ entry }: { entry: RankEntry }) {
  const couch = entry.title.id === 'couch';
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border px-2 py-3 text-center ${
        couch ? 'border-gray-100 bg-gray-50/60' : 'border-gray-200 bg-white'
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-cyan-100 text-3xl font-bold shadow-sm ring-2 ring-white ${
          couch ? 'opacity-40 grayscale' : ''
        }`}
      >
        {entry.avatar}
      </div>
      <div className={`mt-1.5 w-full truncate text-sm font-medium ${couch ? 'text-gray-400' : 'text-gray-800'}`}>
        {entry.nickname}
      </div>
      <span
        className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
          TITLE_CHIP[entry.title.id] ?? 'bg-slate-100 text-slate-600'
        }`}
      >
        {entry.title.emoji} {entry.title.name}
      </span>
      {!couch && <div className="mt-1 text-[10px] text-gray-400">{entry.count} 次</div>}
    </div>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range: RangeKey = sp.range === 'month' || sp.range === 'all' ? sp.range : 'week';

  const [climberRows, bookingRows] = await Promise.all([
    db
      .select({
        id: climbers.id,
        nickname: climbers.nickname,
        avatar: climbers.avatar,
        cancelCount: climbers.cancelCount,
      })
      .from(climbers),
    db
      .select({
        climberId: bookings.climberId,
        date: bookings.date,
        time: bookings.time,
        gymId: bookings.gymId,
      })
      .from(bookings),
  ]);

  const { entries, pigeons } = computeLeaderboard(climberRows, bookingRows, range);
  const rangeLabel = RANGE_TABS.find((t) => t.key === range)?.label ?? '本周';
  const top = entries.filter((e) => e.count > 0).slice(0, 10);
  const titleWall = [...entries].sort((a, b) => {
    if (a.title.id === 'couch' && b.title.id !== 'couch') return 1;
    if (a.title.id !== 'couch' && b.title.id === 'couch') return -1;
    return 0;
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">🏆 排行榜</h1>
        <Link href="/" className="text-sm text-gray-500 transition hover:text-sky-600">
          ← 返回日历
        </Link>
      </div>

      <div className="mt-4 flex gap-2">
        {RANGE_TABS.map((t) => (
          <Link
            key={t.key}
            href={`/leaderboard?range=${t.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              range === t.key
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-sky-600'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">{rangeLabel}头衔</h2>
      <p className="mt-1 text-xs text-gray-400">人人有份，躺平也是态度</p>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {titleWall.map((e) => (
          <TitleCard key={e.climberId} entry={e} />
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">出勤榜</h2>
      {top.length === 0 ? (
        <p className="mt-3 text-gray-500">这周还没人报名，快来开第一单 🧗</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {top.map((e, i) => (
            <li
              key={e.climberId}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <span className="w-8 text-center text-lg font-bold text-gray-700">
                {MEDALS[i] ?? i + 1}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-cyan-100 text-xl font-bold ring-2 ring-white">
                {e.avatar}
              </div>
              <span className="flex-1 truncate font-medium text-gray-900">{e.nickname}</span>
              <span className="text-sm font-semibold text-sky-600">{e.count} 次</span>
            </li>
          ))}
        </ol>
      )}

      <h2 className="mt-8 text-lg font-semibold text-gray-900">🐦 鸽子王</h2>
      {pigeons.length === 0 ? (
        <p className="mt-3 text-gray-500">暂无鸽子，一片祥和 🕊️</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {pigeons.map((p, i) => (
            <li
              key={p.climberId}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <span className="w-8 text-center text-lg font-bold text-gray-700">
                {MEDALS[i] ?? i + 1}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-gray-100 text-xl font-bold ring-2 ring-white">
                {p.avatar}
              </div>
              <span className="flex-1 truncate font-medium text-gray-900">{p.nickname}</span>
              <span className="text-sm font-semibold text-gray-500">鸽了 {p.cancelCount} 次</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
