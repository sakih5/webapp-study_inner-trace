import type { LogEntry, RetroEntry } from './types';

export function sortLogEntries(entries: LogEntry[]): LogEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    // 仮行は日付グループの先頭
    if (a.id === '__provisional__') return -1;
    if (b.id === '__provisional__') return 1;
    // 開始時間 null は最後尾（'99:99' として扱う）
    const at = a.start_time ?? '99:99';
    const bt = b.start_time ?? '99:99';
    return bt.localeCompare(at);
  });
}

export function sortRetroEntries(entries: RetroEntry[]): RetroEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    if (a.id === '__provisional__') return -1;
    if (b.id === '__provisional__') return 1;
    return 0;
  });
}

export function generateTimeOptions(): { value: string; label: string }[] {
  const options = [{ value: '', label: '—' }];
  for (let h = 5; h < 30; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 29 && m > 50) break;
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const label =
        h >= 24
          ? `翌${String(h - 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
          : value;
      options.push({ value, label });
    }
  }
  return options;
}
