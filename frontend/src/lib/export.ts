import type { LogEntry, RetroEntry } from './types';
import { formatDateLabel, groupByDate } from './dateUtils';

export function buildLogText(entries: LogEntry[], weekLabel: string): string {
  const header = `■ 行動・感情記録 ${weekLabel}`;
  const byDate = groupByDate(entries);
  const body = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, rows]) => {
      const label = formatDateLabel(date);
      const lines = rows.map(e => {
        const start = e.start_time || '--:--';
        const end = e.end_time || '--:--';
        const emotion = e.emotion ? ` [${e.emotion}]` : '';
        return `  ${start} 〜 ${end}  ${e.action}${emotion}`;
      }).join('\n');
      return `【${label}】\n${lines}`;
    }).join('\n\n');
  return `${header}\n\n${body}`;
}

export function buildRetroText(entries: RetroEntry[], weekLabel: string): string {
  const header = `■ 振り返り ${weekLabel}`;
  const byDate = groupByDate(entries);
  const body = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, rows]) => {
      const label = formatDateLabel(date);
      const lines = rows.map(e => `  [${e.type}][${e.category}] ${e.content}`).join('\n');
      return `【${label}】\n${lines}`;
    }).join('\n\n');
  return `${header}\n\n${body}`;
}
