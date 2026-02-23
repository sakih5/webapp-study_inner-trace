import type { WeekRange } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): string {
  return fmt(new Date());
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const todayStr = fmt(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = fmt(yesterday);
  const suffix =
    dateStr === todayStr ? ' — 今日' :
    dateStr === yesterdayStr ? ' — 昨日' : '';
  return `${dateStr.replace(/-/g, '/')} (${dayNames[d.getDay()]})${suffix}`;
}

function getWeekMonday(dateStr: string): Date {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=日
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday;
}

export function getWeekRange(dateStr: string): WeekRange {
  const monday = getWeekMonday(dateStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const from = fmt(monday);
  const to = fmt(sunday);
  return {
    from,
    to,
    label: `${from.replace(/-/g, '/')} 〜 ${to.replace(/-/g, '/')}`,
  };
}

export function groupByWeek<T extends { date: string }>(
  entries: T[],
): Map<string, { week: WeekRange; entries: T[] }> {
  const map = new Map<string, { week: WeekRange; entries: T[] }>();
  for (const entry of entries) {
    const week = getWeekRange(entry.date);
    const key = week.from;
    if (!map.has(key)) map.set(key, { week, entries: [] });
    map.get(key)!.entries.push(entry);
  }
  // 新しい週が先頭（降順）
  return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

export function groupByDate<T extends { date: string }>(
  entries: T[],
): Record<string, T[]> {
  return entries.reduce((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {} as Record<string, T[]>);
}
