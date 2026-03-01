'use client';

import { useState } from 'react';
import { generateTimeOptions } from '@/lib/logUtils';
import type { LogEntry } from '@/lib/types';

const TIME_OPTIONS = generateTimeOptions();

interface Props {
  initialDate: string;
  onSave: (entry: Omit<LogEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onClose: () => void;
}

export function AddEntryModal({ initialDate, onSave, onClose }: Props) {
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [action, setAction] = useState('');
  const [emotion, setEmotion] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!action.trim()) return;
    setSaving(true);
    try {
      await onSave({
        date,
        start_time: startTime || null,
        end_time: endTime || null,
        action: action.trim(),
        emotion: emotion.trim() || null,
      });
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
      <div
        className="bg-bg border border-border rounded-lg p-6 w-[420px] max-w-[90vw] flex flex-col gap-4 shadow-lg"

      >
        <h2 className="font-mono text-[13px] font-semibold text-ink">新規記録</h2>

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

        {/* 開始・終了時間 */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-ink-light">Start</label>
            <select
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="font-mono text-[12px] bg-paper border border-border rounded px-2 py-1.5 text-ink outline-none cursor-pointer"
            >
              {TIME_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-ink-light">End</label>
            <select
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="font-mono text-[12px] bg-paper border border-border rounded px-2 py-1.5 text-ink outline-none cursor-pointer"
            >
              {TIME_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 行動 */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-wider text-ink-light">Action</label>
          <textarea
            value={action}
            onChange={e => setAction(e.target.value)}
            placeholder="行動を入力..."
            rows={3}
            autoFocus
            className="font-mono text-[12px] bg-paper border border-border rounded px-2 py-1.5 text-ink outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* 感情 */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9px] uppercase tracking-wider text-ink-light">Emotion</label>
          <textarea
            value={emotion}
            onChange={e => setEmotion(e.target.value)}
            placeholder="感情..."
            rows={2}
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
            disabled={!action.trim() || saving}
            className="font-mono text-[11px] px-3 py-1.5 bg-ink text-bg rounded hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
