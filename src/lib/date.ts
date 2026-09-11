export const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWeekDates(reference = new Date()): Date[] {
  const day = reference.getDay(); // 0=周日 ... 6=周六
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(reference);
  monday.setDate(reference.getDate() + offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function isToday(d: Date): boolean {
  return toDateString(d) === toDateString(new Date());
}

export function formatDayLabel(d: Date): string {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day}`;
}
