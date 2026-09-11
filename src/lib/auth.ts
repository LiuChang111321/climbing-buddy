import { eq } from 'drizzle-orm';
import { db } from './db';
import { climbers } from './db/schema';

export async function verifyClimberSecret(climberId: string, secret: string): Promise<boolean> {
  const [row] = await db
    .select({ secret: climbers.secret })
    .from(climbers)
    .where(eq(climbers.id, climberId));
  return !!row && row.secret === secret;
}
