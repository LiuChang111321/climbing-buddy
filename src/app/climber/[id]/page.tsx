import { desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { bookings, climbers, gyms } from '@/lib/db/schema';
import { isUuid } from '@/lib/validate';

export default async function ClimberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [climber] = await db
    .select({
      id: climbers.id,
      nickname: climbers.nickname,
      avatar: climbers.avatar,
      signature: climbers.signature,
    })
    .from(climbers)
    .where(eq(climbers.id, id));
  if (!climber) notFound();

  const history = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      time: bookings.time,
      gymName: gyms.name,
    })
    .from(bookings)
    .innerJoin(gyms, eq(bookings.gymId, gyms.id))
    .where(eq(bookings.climberId, id))
    .orderBy(desc(bookings.date), desc(bookings.time));

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
