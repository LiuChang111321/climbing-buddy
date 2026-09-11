import { desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BADGES, RARITY_ORDER, type BadgeDef, type Rarity } from '@/lib/badges';
import { db } from '@/lib/db';
import { badges, bookings, climbers, gyms } from '@/lib/db/schema';
import { isUuid } from '@/lib/validate';

const RARITY_BORDER: Record<Rarity, string> = {
  common: 'from-stone-300 via-amber-200 to-stone-300',
  rare: 'from-slate-300 via-sky-200 to-slate-300',
  legendary: 'from-yellow-300 via-amber-300 to-yellow-400',
};

function BadgeCard({ badge, unlocked }: { badge: BadgeDef; unlocked: boolean }) {
  if (!unlocked) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-2 py-3 text-center">
        <div className="text-3xl opacity-30 grayscale">🔒</div>
        <div className="mt-1 text-xs font-semibold text-gray-400">{badge.name}</div>
        <div className="mt-0.5 text-[10px] leading-tight text-gray-300">{badge.desc}</div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br p-[2px] ${
        RARITY_BORDER[badge.rarity]
      } ${badge.rarity === 'legendary' ? 'animate-pulse' : ''}`}
    >
      <div className="flex h-full flex-col items-center rounded-2xl bg-white px-2 py-3 text-center">
        <div className="text-3xl">{badge.emoji}</div>
        <div className="mt-1 text-xs font-bold text-gray-800">{badge.name}</div>
        <div className="mt-0.5 text-[10px] leading-tight text-gray-500">{badge.desc}</div>
      </div>
    </div>
  );
}

export default async function ClimberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [[climber], history, badgeRows] = await Promise.all([
    db
      .select({
        id: climbers.id,
        nickname: climbers.nickname,
        avatar: climbers.avatar,
        signature: climbers.signature,
      })
      .from(climbers)
      .where(eq(climbers.id, id)),
    db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        gymName: gyms.name,
      })
      .from(bookings)
      .innerJoin(gyms, eq(bookings.gymId, gyms.id))
      .where(eq(bookings.climberId, id))
      .orderBy(desc(bookings.date), desc(bookings.time)),
    db
      .select({ badgeId: badges.badgeId })
      .from(badges)
      .where(eq(badges.climberId, id)),
  ]);
  if (!climber) notFound();
  const unlockedIds = new Set(badgeRows.map((b) => b.badgeId));

  const sortedBadges = [...BADGES].sort(
    (a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity],
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 transition hover:text-sky-600">
        ← 返回日历
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-cyan-100 text-6xl font-bold shadow-sm ring-2 ring-white">
          {climber.avatar}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{climber.nickname}</h1>
          {climber.signature && (
            <p className="mt-1 text-sm italic text-gray-600">「{climber.signature}」</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            共报名 <span className="font-semibold text-sky-600">{history.length}</span> 次
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">
        我的勋章{' '}
        <span className="text-sm font-normal text-gray-400">
          {unlockedIds.size}/{BADGES.length}
        </span>
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {sortedBadges.map((b) => (
          <BadgeCard key={b.id} badge={b} unlocked={unlockedIds.has(b.id)} />
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">报名历史</h2>
      {history.length === 0 ? (
        <p className="mt-3 text-gray-500">还没有报名记录</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {history.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
            >
              <span className="font-medium text-gray-900">{h.date}</span>
              <span className="text-gray-600">{h.time}</span>
              <span className="text-gray-600">{h.gymName}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
