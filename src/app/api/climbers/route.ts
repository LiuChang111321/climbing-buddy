import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { climbers } from '@/lib/db/schema';
import { isUuid } from '@/lib/validate';

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const { id, nickname, avatar, signature, secret } = body as Record<string, unknown>;

  if (!isUuid(id)) {
    return Response.json({ error: 'invalid id' }, { status: 400 });
  }
  if (!isUuid(secret)) {
    return Response.json({ error: 'invalid secret' }, { status: 400 });
  }
  if (typeof nickname !== 'string' || nickname.trim() === '') {
    return Response.json({ error: 'nickname required' }, { status: 400 });
  }
  if (typeof avatar !== 'string' || avatar.trim() === '') {
    return Response.json({ error: 'avatar required' }, { status: 400 });
  }
  if (signature !== undefined && typeof signature !== 'string') {
    return Response.json({ error: 'invalid signature' }, { status: 400 });
  }

  const name = nickname.trim().slice(0, 20);
  const av = avatar.trim().slice(0, 32);
  const sig = typeof signature === 'string' ? signature.trim().slice(0, 60) : '';

  const [existing] = await db
    .select({ secret: climbers.secret })
    .from(climbers)
    .where(eq(climbers.id, id));
  if (existing && existing.secret !== secret) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const [row] = await db
    .insert(climbers)
    .values({ id, nickname: name, avatar: av, signature: sig, secret })
    .onConflictDoUpdate({
      target: climbers.id,
      set: { nickname: name, avatar: av, signature: sig },
    })
    .returning({
      id: climbers.id,
      nickname: climbers.nickname,
      avatar: climbers.avatar,
      signature: climbers.signature,
    });

  return Response.json(row);
}
