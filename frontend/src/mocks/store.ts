import type { LogEntry, RetroEntry, UserOption } from '@/lib/types';
import { MOCK_LOG_ENTRIES, MOCK_RETRO_ENTRIES, MOCK_USER_OPTIONS } from './data';

// モジュールレベルのシングルトン（ブラウザ側でのみ使用）
let logEntries: LogEntry[] = JSON.parse(JSON.stringify(MOCK_LOG_ENTRIES));
let retroEntries: RetroEntry[] = JSON.parse(JSON.stringify(MOCK_RETRO_ENTRIES));
let userOptions: UserOption[] = JSON.parse(JSON.stringify(MOCK_USER_OPTIONS));

export const mockLogStore = {
  getByRange(from: string, to: string): LogEntry[] {
    return logEntries.filter(e => e.date >= from && e.date <= to);
  },

  add(entry: Omit<LogEntry, 'id' | 'created_at' | 'updated_at'>): LogEntry {
    const newEntry: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    logEntries.push(newEntry);
    return newEntry;
  },

  update(id: string, patch: Partial<LogEntry>): LogEntry {
    const idx = logEntries.findIndex(e => e.id === id);
    if (idx === -1) throw new Error(`LogEntry ${id} not found`);
    logEntries[idx] = { ...logEntries[idx], ...patch, updated_at: new Date().toISOString() };
    return logEntries[idx];
  },

  remove(id: string): void {
    logEntries = logEntries.filter(e => e.id !== id);
  },
};

export const mockRetroStore = {
  getByRange(from: string, to: string): RetroEntry[] {
    return retroEntries.filter(e => e.date >= from && e.date <= to);
  },

  add(entry: Omit<RetroEntry, 'id' | 'created_at' | 'updated_at'>): RetroEntry {
    const newEntry: RetroEntry = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    retroEntries.push(newEntry);
    return newEntry;
  },

  update(id: string, patch: Partial<RetroEntry>): RetroEntry {
    const idx = retroEntries.findIndex(e => e.id === id);
    if (idx === -1) throw new Error(`RetroEntry ${id} not found`);
    retroEntries[idx] = { ...retroEntries[idx], ...patch, updated_at: new Date().toISOString() };
    return retroEntries[idx];
  },

  remove(id: string): void {
    retroEntries = retroEntries.filter(e => e.id !== id);
  },
};

export const mockOptionsStore = {
  getByType(optionType: UserOption['option_type']): UserOption[] {
    return userOptions
      .filter(o => o.option_type === optionType)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  add(optionType: UserOption['option_type'], label: string): UserOption {
    const typeOptions = userOptions.filter(o => o.option_type === optionType);
    const maxOrder = typeOptions.reduce((max, o) => Math.max(max, o.sort_order), -1);
    const newOption: UserOption = {
      id: crypto.randomUUID(),
      option_type: optionType,
      label,
      sort_order: maxOrder + 1,
    };
    userOptions.push(newOption);
    return newOption;
  },

  remove(id: string): void {
    userOptions = userOptions.filter(o => o.id !== id);
  },
};
