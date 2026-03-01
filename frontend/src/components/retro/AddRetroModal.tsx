'use client';

import { useState } from 'react';
import type { RetroEntry, UserOption } from '@/lib/types';

interface Props {
  initialDate: string;
  typeOptions: UserOption[];
  categoryOptions: UserOption[];
  onSave: (entry: Omit<RetroEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onClose: () => void;
}

export function AddRetroModal({ initialDate, typeOptions, categoryOptions, onSave, onClose }: Props) {
  const [date, setDate] = useState(initialDate);
  const [type, setType] = useState(typeOptions[0]?.label ?? '');
  const [category, setCategory] = useState(categoryOptions[0]?.label ?? '');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSave({ date, type, category, content: content.trim() });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-bg border border-border rounded-lg p-6 w-[420px] max-w-[90vw] flex flex-col gap-4 shadow-lg">
        <h2 className="font-mono text-[13px] font-semibold text-ink">新規振り返り</h2>

        {/* 日付 */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-wider text-ink-light">日付</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="font-mono text-[12px] bg-paper border border-border rounded px-2 py-1.5 text-ink outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* タイプ・カテゴリ */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-ink-light">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="font-mono text-[12px] bg-paper border border-border rounded px-2 py-1.5 text-ink outline-none cursor-pointer"
            >
              {typeOptions.map(o => (
                <option key={o.id} value={o.label}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-ink-light">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="font-mono text-[12px] bg-paper border border-border rounded px-2 py-1.5 text-ink outline-none cursor-pointer"
            >
              {categoryOptions.map(o => (
                <option key={o.id} value={o.label}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 振り返り内容 */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-wider text-ink-light">Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="振り返り内容を入力..."
            rows={4}
            autoFocus
            className="font-mono text-[12px] bg-paper border border-border rounded px-2 py-1.5 text-ink outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* ボタン */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="font-mono text-[11px] px-3 py-1.5 border border-border rounded hover:bg-paper transition-colors text-ink"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="font-mono text-[11px] px-3 py-1.5 bg-ink text-bg rounded hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
