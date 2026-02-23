'use client';

import type { RetroEntry, UserOption } from '@/lib/types';
import { ExpandableCell } from '@/components/shared/ExpandableCell';

interface RetroRowProps {
  entry: RetroEntry;
  typeOptions: UserOption[];
  categoryOptions: UserOption[];
  isOdd?: boolean;
  isProvisional?: boolean;
  onUpdate: (id: string, patch: Partial<RetroEntry>) => void;
  onDelete: (id: string) => void;
  onProvisionalContent?: (content: string) => void;
}

export function RetroRow({
  entry,
  typeOptions,
  categoryOptions,
  isOdd,
  isProvisional,
  onUpdate,
  onDelete,
  onProvisionalContent,
}: RetroRowProps) {
  const rowBg = isOdd ? 'bg-bg' : 'bg-paper';

  const typeLabels = typeOptions.map(o => o.label);
  const categoryLabels = categoryOptions.map(o => o.label);
  const isOrphanedType = entry.type !== '' && !typeLabels.includes(entry.type);
  const isOrphanedCategory = entry.category !== '' && !categoryLabels.includes(entry.category);

  const handleContentChange = (value: string) => {
    if (isProvisional) {
      onProvisionalContent?.(value);
    } else {
      onUpdate(entry.id, { content: value });
    }
  };

  return (
    <tr className={`${rowBg} hover:bg-paper/60 transition-colors group`}>
      {/* タイプ */}
      <td className="px-1 py-1 w-[110px]">
        <select
          value={entry.type}
          onChange={e => onUpdate(entry.id, { type: e.target.value })}
          className="w-full font-mono text-[12px] bg-transparent text-ink border-none outline-none cursor-pointer"
        >
          {isOrphanedType && (
            <option value={entry.type} style={{ color: 'gray' }}>
              {entry.type}（削除済み）
            </option>
          )}
          {typeOptions.map(o => (
            <option key={o.id} value={o.label}>{o.label}</option>
          ))}
        </select>
      </td>

      {/* カテゴリ */}
      <td className="px-1 py-1 w-[90px]">
        <select
          value={entry.category}
          onChange={e => onUpdate(entry.id, { category: e.target.value })}
          className="w-full font-mono text-[12px] bg-transparent text-ink border-none outline-none cursor-pointer"
        >
          {isOrphanedCategory && (
            <option value={entry.category} style={{ color: 'gray' }}>
              {entry.category}（削除済み）
            </option>
          )}
          {categoryOptions.map(o => (
            <option key={o.id} value={o.label}>{o.label}</option>
          ))}
        </select>
      </td>

      {/* 振り返り内容 */}
      <td className="px-0 py-0">
        <ExpandableCell
          value={entry.content}
          placeholder="振り返り内容を入力..."
          onChange={handleContentChange}
          autoOpen={isProvisional}
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
