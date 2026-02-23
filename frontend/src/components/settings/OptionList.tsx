'use client';

import { useState } from 'react';

interface Option {
  id: string;
  label: string;
}

interface OptionListProps {
  options: Option[];
  onAdd: (label: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function OptionList({ options, onAdd, onRemove }: OptionListProps) {
  const [inputValue, setInputValue] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<Option | null>(null);

  const handleAdd = async () => {
    const label = inputValue.trim();
    if (!label) return;
    setInputValue('');
    await onAdd(label);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    await onRemove(confirmTarget.id);
    setConfirmTarget(null);
  };

  return (
    <>
      {/* オプション一覧 */}
      <ul className="mb-3">
        {options.map(o => (
          <li
            key={o.id}
            className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
          >
            <span className="text-[13px] text-ink">{o.label}</span>
            <button
              onClick={() => setConfirmTarget(o)}
              className="text-ink-light hover:text-problem transition-colors font-mono text-[14px] px-1 leading-none"
              aria-label={`${o.label}を削除`}
            >
              ×
            </button>
          </li>
        ))}
        {options.length === 0 && (
          <li className="py-1.5 text-[12px] font-mono text-ink-light">オプションなし</li>
        )}
      </ul>

      {/* 追加フォーム */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="新しいオプションを入力"
          className="flex-1 text-[12px] font-mono px-2 py-1.5 border border-border rounded bg-transparent text-ink placeholder:text-ink-light outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={handleAdd}
          className="font-mono text-[11px] px-3 py-1.5 bg-ink text-bg rounded hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          ＋ 追加
        </button>
      </div>

      {/* 削除確認ダイアログ */}
      {confirmTarget && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/20"
          onClick={() => setConfirmTarget(null)}
        >
          <div
            className="bg-bg border border-border rounded-xl shadow-lg p-6 w-[320px]"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[13px] text-ink mb-1">
              「{confirmTarget.label}」を削除しますか？
            </p>
            <p className="text-[11px] text-ink-light font-mono mb-5">
              既存の記録に使われている場合でも削除されます。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="font-mono text-[11px] px-4 py-1.5 border border-border rounded hover:bg-paper transition-colors text-ink"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                className="font-mono text-[11px] px-4 py-1.5 bg-problem text-bg rounded hover:opacity-80 transition-opacity"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
