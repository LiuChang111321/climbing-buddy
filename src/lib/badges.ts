export type Rarity = 'common' | 'rare' | 'legendary';

export type BadgeDef = {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  desc: string;
};

export const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  legendary: 2,
};

export const BADGES: BadgeDef[] = [
  { id: 'first_step', name: '破冰', emoji: '👶', rarity: 'common', desc: '完成第一次报名' },
  { id: 'night_owl', name: '夜猫子', emoji: '🌙', rarity: 'common', desc: '至少 2 次且全在晚上（≥18 点）' },
  { id: 'early_bird', name: '早鸟', emoji: '🌅', rarity: 'common', desc: '爬过早场（10 点前）' },
  { id: 'weekly_regular', name: '周常客', emoji: '🔥', rarity: 'rare', desc: '一周报名 ≥2 次' },
  { id: 'monthly_regular', name: '月卡王', emoji: '📅', rarity: 'rare', desc: '一个月报名 ≥8 次' },
  { id: 'explorer', name: '探店达人', emoji: '🧭', rarity: 'rare', desc: '去过 ≥3 家馆' },
  { id: 'pigeon_king', name: '鸽子王', emoji: '🐦', rarity: 'rare', desc: '累计取消 ≥3 次' },
  { id: 'tryhard', name: '卷王', emoji: '💪', rarity: 'legendary', desc: '单周报名 ≥4 次' },
  { id: 'streak4', name: '连击', emoji: '🏃', rarity: 'legendary', desc: '连续 4 周都报名' },
  { id: 'curator', name: '馆长', emoji: '🏛️', rarity: 'legendary', desc: '去过 ≥8 家馆' },
];

export const BADGE_MAP: Record<string, BadgeDef> = Object.fromEntries(
  BADGES.map((b) => [b.id, b]),
);

export type BookingLike = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  gymId: number;
};

const pad = (n: number) => String(n).padStart(2, '0');

function hourOf(time: string): number {
  return Number(time.slice(0, 2));
}

function weekKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0=周日
  const diff = day === 0 ? -6 : 1 - day; // 到周一的偏移
  const monday = new Date(y, m - 1, d + diff);
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
}

function anyWeekCount(bookings: BookingLike[], min: number): boolean {
  const count = new Map<string, number>();
  for (const b of bookings) {
    const k = weekKey(b.date);
    count.set(k, (count.get(k) ?? 0) + 1);
  }
  return [...count.values()].some((n) => n >= min);
}

function anyMonthCount(bookings: BookingLike[], min: number): boolean {
  const count = new Map<string, number>();
  for (const b of bookings) {
    const k = b.date.slice(0, 7);
    count.set(k, (count.get(k) ?? 0) + 1);
  }
  return [...count.values()].some((n) => n >= min);
}

function streakWeeks(bookings: BookingLike[]): number {
  const keys = [...new Set(bookings.map((b) => weekKey(b.date)))].sort();
  if (keys.length === 0) return 0;

  const parse = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  let max = 1;
  let cur = 1;
  for (let i = 1; i < keys.length; i++) {
    const diffDays = Math.round((parse(keys[i]) - parse(keys[i - 1])) / 86400000);
    cur = diffDays === 7 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

export function evaluateBadges(bookings: BookingLike[], cancelCount: number): string[] {
  const unlocked: string[] = [];

  if (bookings.length >= 1) unlocked.push('first_step');
  if (bookings.length >= 2 && bookings.every((b) => hourOf(b.time) >= 18)) {
    unlocked.push('night_owl');
  }
  if (bookings.some((b) => hourOf(b.time) < 10)) unlocked.push('early_bird');
  if (anyWeekCount(bookings, 2)) unlocked.push('weekly_regular');
  if (anyWeekCount(bookings, 4)) unlocked.push('tryhard');
  if (anyMonthCount(bookings, 8)) unlocked.push('monthly_regular');
  if (streakWeeks(bookings) >= 4) unlocked.push('streak4');
  if (cancelCount >= 3) unlocked.push('pigeon_king');

  const gymCount = new Set(bookings.map((b) => b.gymId)).size;
  if (gymCount >= 3) unlocked.push('explorer');
  if (gymCount >= 8) unlocked.push('curator');

  return unlocked;
}

export function topBadge(badgeIds: string[]): BadgeDef | undefined {
  const defs = badgeIds
    .map((id) => BADGE_MAP[id])
    .filter((b): b is BadgeDef => Boolean(b))
    .filter((b) => b.rarity !== 'common');
  if (defs.length === 0) return undefined;
  return defs.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])[0];
}
