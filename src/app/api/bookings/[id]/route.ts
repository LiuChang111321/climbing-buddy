import { and, eq } from 'drizzle-orm';
import { verifyClimberSecret } from '@/lib/auth';
import { db } from '@/lib/db';
import { bookings, gyms } from '@/lib/db/schema';
import { isDateStr, isTimeStr, isUuid } from '@/lib/validate';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bookingId = Number(id);

  if (!Number.isInteger(bookingId)) {
    return Response.json({ error: 'invalid id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const { userId, secret, gymId, date, time } = body as Record<string, unknown>;

  if (!isUuid(userId)) {
    return Response.json({ error: 'invalid userId' }, { status: 400 });
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

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }
  if (booking.climberId !== userId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  const authorized = await verifyClimberSecret(userId, secret);
  if (!authorized) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const gymRows = await db.select({ id: gyms.id }).from(gyms).where(eq(gyms.id, gymId));
  if (gymRows.length === 0) {
    return Response.json({ error: 'unknown gym' }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.climberId, userId), eq(bookings.date, date), eq(bookings.time, time)));
  if (existing.some((b) => b.id !== bookingId)) {
    return Response.json({ error: 'duplicate booking' }, { status: 409 });
  }

  const [updated] = await db
    .update(bookings)
    .set({ gymId, date, time })
    .where(eq(bookings.id, bookingId))
    .returning();

  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bookingId = Number(id);

  if (!Number.isInteger(bookingId)) {
    return Response.json({ error: 'invalid id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const { userId, secret } = body as Record<string, unknown>;

  if (!isUuid(userId)) {
    return Response.json({ error: 'invalid userId' }, { status: 400 });
  }
  if (!isUuid(secret)) {
    return Response.json({ error: 'invalid secret' }, { status: 400 });
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }
  if (booking.climberId !== userId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  const authorized = await verifyClimberSecret(userId, secret);
  if (!authorized) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  await db.delete(bookings).where(eq(bookings.id, bookingId));
  return Response.json({ ok: true });
}
