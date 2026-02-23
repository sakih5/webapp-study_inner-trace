'use client';

import type { LogEntry } from '@/lib/types';
import { ExpandableCell } from '@/components/shared/ExpandableCell';
import { generateTimeOptions } from '@/lib/logUtils';

const TIME_OPTIONS = generateTimeOptions();

interface LogRowProps {
  entry: LogEntry;
  isOdd?: boolean;
  isProvisional?: boolean;
  onUpdate: (id: string, patch: Partial<LogEntry>) => void;
  onDelete: (id: string) => void;
  onProvisionalAction?: (action: string) => void;
}

export function LogRow({
  entry,
  isOdd,
  isProvisional,
  onUpdate,
  onDelete,
  onProvisionalAction,
}: LogRowProps) {
  const rowBg = isOdd ? 'bg-bg' : 'bg-paper';

  const handleActionChange = (value: string) => {
    if (!isProvisional) {
      onUpdate(entry.id, { action: value });
    }
  };

  return (
    <tr className={`${rowBg} hover:bg-paper/60 transition-colors group`}>
      {/* 開始時間 */}
      <td className="px-1 py-1 w-[90px]">
        <select
          value={entry.start_time ?? ''}
          onChange={e => onUpdate(entry.id, { start_time: e.target.value || null })}
          className="w-full font-mono text-[12px] bg-transparent text-ink border-none outline-none cursor-pointer"
        >
          {TIME_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </td>

      {/* 終了時間 */}
      <td className="px-1 py-1 w-[90px]">
        <select
          value={entry.end_time ?? ''}
          onChange={e => onUpdate(entry.id, { end_time: e.target.value || null })}
          className="w-full font-mono text-[12px] bg-transparent text-ink border-none outline-none cursor-pointer"
        >
          {TIME_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </td>

      {/* 行動 */}
      <td className="px-0 py-0">
        <ExpandableCell
          value={entry.action}
          placeholder="行動を入力..."
          onChange={handleActionChange}
          onCommit={isProvisional ? onProvisionalAction : undefined}
          autoOpen={isProvisional}
        />
      </td>

      {/* 感情 */}
      <td className="px-0 py-0">
        <ExpandableCell
          value={entry.emotion ?? ''}
          placeholder="感情..."
          onChange={v => onUpdate(entry.id, { emotion: v.trim() || null })}
        />
      </td>

      {/* 削除 */}
      <td className="px-1 py-1 w-[40px] text-center">
        <button
          onClick={() => onDelete(entry.id)}
          className="text-ink-light hover:text-problem transition-colors opacity-0 group-hover:opacity-100 font-mono text-[14px] leading-none"
          aria-label="削除"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
