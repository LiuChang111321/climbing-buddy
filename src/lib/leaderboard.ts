import { toDateString } from './date';

export type RangeKey = 'week' | 'month' | 'all';

export type TitleDef = {
  id: string;
  name: string;
  emoji: string;
};

export type RankEntry = {
  climberId: string;
  nickname: string;
  avatar: string;
  count: number;
  gymCount: number;
  title: TitleDef;
};

export type PigeonEntry = {
  climberId: string;
  nickname: string;
  avatar: string;
  cancelCount: number;
};

export type ClimberLike = {
  id: string;
  nickname: string;
  avatar: string;
  cancelCount: number;
};

export type BookingLike = {
  climberId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  gymId: number;
};

const TITLES: Record<string, TitleDef> = {
  tryhard: { id: 'tryhard', name: '卷王', emoji: '💪' },
  explorer: { id: 'explorer', name: '浪子', emoji: '🧭' },
  night_owl: { id: 'night_owl', name: '夜猫子', emoji: '🌙' },
  early_bird: { id: 'early_bird', name: '早鸟', emoji: '🌅' },
  regular: { id: 'regular', name: '周常客', emoji: '🔥' },
  rising: { id: 'rising', name: '渐入佳境', emoji: '📈' },
  rookie: { id: 'rookie', name: '萌新', emoji: '👶' },
  checkin: { id: 'checkin', name: '打卡', emoji: '✍️' },
  couch: { id: 'couch', name: '躺平', emoji: '🛋️' },
};

const pad = (n: number) => String(n).padStart(2, '0');

function shanghaiDate(instant: Date): { y: number; m: number; d: number; wd: number } {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
  const [y, m, d] = s.split('-').map(Number);
  return { y, m: m - 1, d, wd: new Date(y, m - 1, d).getDay() };
}

function addDays(y: number, m: number, d: number, delta: number): string {
  return toDateString(new Date(y, m, d + delta));
}

function weekRange(now: Date): [string, string] {
  const { y, m, d, wd } = shanghaiDate(now);
  const offset = wd === 0 ? -6 : 1 - wd;
  return [addDays(y, m, d, offset), addDays(y, m, d, offset + 6)];
}

function monthRange(now: Date): [string, string] {
  const { y, m } = shanghaiDate(now);
  const last = new Date(y, m + 1, 0).getDate();
  return [`${y}-${pad(m + 1)}-01`, `${y}-${pad(m + 1)}-${pad(last)}`];
}

function rangeBounds(range: RangeKey, now: Date): [string, string] {
  if (range === 'week') return weekRange(now);
  if (range === 'month') return monthRange(now);
  return ['0000-00-00', '9999-99-99'];
}

function prevRange(range: RangeKey, now: Date): [string, string] {
  if (range === 'week') {
    const { y, m, d, wd } = shanghaiDate(now);
    const offset = wd === 0 ? -6 : 1 - wd;
    return [addDays(y, m, d, offset - 7), addDays(y, m, d, offset - 1)];
  }
  if (range === 'month') {
    const { y, m } = shanghaiDate(now);
    const py = m === 0 ? y - 1 : y;
    const pm = m === 0 ? 11 : m - 1;
    const last = new Date(y, m, 0).getDate();
    return [`${py}-${pad(pm + 1)}-01`, `${py}-${pad(pm + 1)}-${pad(last)}`];
  }
  return ['9999-99-99', '0000-00-00'];
}

type Stat = { count: number; gyms: Set<number>; nights: boolean; early: boolean };

function assignTitle(
  s: Stat,
  maxCount: number,
  maxGyms: number,
  prevCount: number,
  isRookie: boolean,
  useRelative: boolean,
): TitleDef {
  if (s.count === 0) return TITLES.couch;
  if (s.count === maxCount && maxCount >= 2) return TITLES.tryhard;
  if (s.gyms.size === maxGyms && maxGyms >= 2) return TITLES.explorer;
  if (s.nights) return TITLES.night_owl;
  if (s.early) return TITLES.early_bird;
  if (s.count >= 2) return TITLES.regular;
  if (useRelative && isRookie) return TITLES.rookie;
  if (useRelative && s.count > prevCount) return TITLES.rising;
  return TITLES.checkin;
}

export function computeLeaderboard(
  climbers: ClimberLike[],
  bookings: BookingLike[],
  range: RangeKey,
  now = new Date(),
): { entries: RankEntry[]; pigeons: PigeonEntry[] } {
  const [start, end] = rangeBounds(range, now);
  const useRelative = range !== 'all';

  const stats = new Map<string, Stat>();
  for (const c of climbers) {
    stats.set(c.id, { count: 0, gyms: new Set(), nights: true, early: false });
  }
  for (const b of bookings) {
    if (b.date < start || b.date > end) continue;
    const s = stats.get(b.climberId);
    if (!s) continue;
    s.count += 1;
    s.gyms.add(b.gymId);
    const hour = Number(b.time.slice(0, 2));
    if (hour < 18) s.nights = false;
    if (hour < 10) s.early = true;
  }

  const maxCount = Math.max(0, ...[...stats.values()].map((s) => s.count));
  const maxGyms = Math.max(0, ...[...stats.values()].map((s) => s.gyms.size));

  const prevCount = new Map<string, number>();
  const firstDate = new Map<string, string>();
  if (useRelative) {
    const [pStart, pEnd] = prevRange(range, now);
    for (const b of bookings) {
      if (b.date >= pStart && b.date <= pEnd) {
        prevCount.set(b.climberId, (prevCount.get(b.climberId) ?? 0) + 1);
      }
      const cur = firstDate.get(b.climberId);
      if (!cur || b.date < cur) firstDate.set(b.climberId, b.date);
    }
  }

  const entries: RankEntry[] = climbers.map((c) => {
    const s = stats.get(c.id) as Stat;
    const isRookie = firstDate.has(c.id) && (firstDate.get(c.id) as string) >= start;
    return {
      climberId: c.id,
      nickname: c.nickname,
      avatar: c.avatar,
      count: s.count,
      gymCount: s.gyms.size,
      title: assignTitle(s, maxCount, maxGyms, prevCount.get(c.id) ?? 0, isRookie, useRelative),
    };
  });

  entries.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.nickname.localeCompare(b.nickname, 'zh-Hans-CN');
  });

  const pigeons: PigeonEntry[] = climbers
    .filter((c) => c.cancelCount > 0)
    .sort((a, b) => b.cancelCount - a.cancelCount)
    .map((c) => ({
      climberId: c.id,
      nickname: c.nickname,
      avatar: c.avatar,
      cancelCount: c.cancelCount,
    }));

  return { entries, pigeons };
}
