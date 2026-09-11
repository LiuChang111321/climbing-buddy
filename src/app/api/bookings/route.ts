import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm';
import { verifyClimberSecret } from '@/lib/auth';
import { unlockNewBadges } from '@/lib/badge-service';
import { topBadge, type BadgeDef } from '@/lib/badges';
import { db } from '@/lib/db';
import { badges, bookings, climbers, gyms } from '@/lib/db/schema';
import { isDateStr, isTimeStr, isUuid } from '@/lib/validate';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end || !isDateStr(start) || !isDateStr(end)) {
    return Response.json({ error: 'start and end (YYYY-MM-DD) required' }, { status: 400 });
  }

  const rows = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      time: bookings.time,
      gymId: gyms.id,
      gymName: gyms.name,
      climberId: climbers.id,
      nickname: climbers.nickname,
      avatar: climbers.avatar,
    })
    .from(bookings)
    .innerJoin(gyms, eq(bookings.gymId, gyms.id))
    .innerJoin(climbers, eq(bookings.climberId, climbers.id))
    .where(and(gte(bookings.date, start), lte(bookings.date, end)))
    .orderBy(asc(bookings.date), asc(bookings.time));

  const climberIds = [...new Set(rows.map((r) => r.climberId))];
  const badgeRows = climberIds.length
    ? await db
        .select({ climberId: badges.climberId, badgeId: badges.badgeId })
        .from(badges)
        .where(inArray(badges.climberId, climberIds))
    : [];

  const badgeIdsByClimber = new Map<string, string[]>();
  for (const b of badgeRows) {
    const list = badgeIdsByClimber.get(b.climberId) ?? [];
    list.push(b.badgeId);
    badgeIdsByClimber.set(b.climberId, list);
  }

  const result = rows.map((r) => {
    const badge = topBadge(badgeIdsByClimber.get(r.climberId) ?? []);
    return badge ? { ...r, badge } : r;
  });

  return Response.json(result);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const { climberId, secret, gymId, date, time } = body as Record<string, unknown>;

  if (!isUuid(climberId)) {
    return Response.json({ error: 'invalid climberId' }, { status: 400 });
  }
  if (!isUuid(secret)) {
    return Response.json({ error: 'invalid secret' }, { status: 400 });
  }
  if (typeof gymId !== 'number' || !Number.isInteger(gymId)) {
    return Response.json({ error: 'invalid gymId' }, { status: 400 });
  }
  if (!isDateStr(date)) {
    return Response.json({ error: 'invalid date' }, { status: 400 });
  }
  if (!isTimeStr(time)) {
    return Response.json({ error: 'invalid time' }, { status: 400 });
  }

  const [authorized, gymRows, existing] = await Promise.all([
    verifyClimberSecret(climberId, secret),
    db.select({ id: gyms.id }).from(gyms).where(eq(gyms.id, gymId)),
    db
      .select()
      .from(bookings)
      .where(and(eq(bookings.climberId, climberId), eq(bookings.date, date), eq(bookings.time, time))),
  ]);
  if (!authorized) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  if (gymRows.length === 0) {
    return Response.json({ error: 'unknown gym' }, { status: 400 });
  }
  if (existing.length > 0) {
    return Response.json({ error: 'duplicate booking' }, { status: 409 });
  }

  const inserted = await db
    .insert(bookings)
    .values({ climberId, gymId, date, time })
    .returning()
    .catch(() => null);

  if (!inserted) {
    return Response.json({ error: 'duplicate booking' }, { status: 409 });
  }

  let newBadges: BadgeDef[] = [];
  try {
    newBadges = await unlockNewBadges(climberId);
  } catch (err) {
    console.error('unlock badges failed:', err);
  }

  return Response.json({ ...inserted[0], newBadges }, { status: 201 });
}
