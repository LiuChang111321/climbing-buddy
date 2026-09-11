import { eq } from 'drizzle-orm';
import { db } from './db';
import { badges, bookings, climbers } from './db/schema';
import { BADGE_MAP, evaluateBadges, type BadgeDef } from './badges';

export async function unlockNewBadges(climberId: string): Promise<BadgeDef[]> {
  const [rows, [climber], existing] = await Promise.all([
    db
      .select({ date: bookings.date, time: bookings.time, gymId: bookings.gymId })
      .from(bookings)
      .where(eq(bookings.climberId, climberId)),
    db
      .select({ cancelCount: climbers.cancelCount })
      .from(climbers)
      .where(eq(climbers.id, climberId)),
    db
      .select({ badgeId: badges.badgeId })
      .from(badges)
      .where(eq(badges.climberId, climberId)),
  ]);
  const existingSet = new Set(existing.map((b) => b.badgeId));

  const eligible = evaluateBadges(rows, climber?.cancelCount ?? 0);
  const newIds = eligible.filter((id) => !existingSet.has(id));

  if (newIds.length > 0) {
    await db
      .insert(badges)
      .values(newIds.map((badgeId) => ({ climberId, badgeId })))
      .onConflictDoNothing();
  }

  return newIds.map((id) => BADGE_MAP[id]);
}
