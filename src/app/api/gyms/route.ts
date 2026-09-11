import { db } from '@/lib/db';
import { gyms } from '@/lib/db/schema';
import { GYMS } from '@/lib/gyms';

export async function GET() {
  const rows = await db.select().from(gyms);
  const order = new Map<string, number>();
  GYMS.forEach((name, i) => order.set(name, i));
  rows.sort((a, b) => (order.get(a.name) ?? GYMS.length) - (order.get(b.name) ?? GYMS.length));
  return Response.json(rows);
}
