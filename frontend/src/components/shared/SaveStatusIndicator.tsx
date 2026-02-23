'use client';

import { useSaveStatus } from '@/contexts/SaveStatusContext';

export function SaveStatusIndicator() {
  const { status } = useSaveStatus();

  if (status === 'idle') return null;

  const config = {
    saving: { text: '保存中...', className: 'text-ink-light' },
    saved:  { text: '✓ 保存済み', className: 'text-keep' },
    error:  { text: '! 保存できませんでした', className: 'text-problem' },
  }[status];

  return (
    <div
      className={`fixed bottom-4 right-5 font-mono text-[11px] ${config.className} pointer-events-none`}
      style={{ zIndex: 300 }}
    >
      {config.text}
    </div>
  );
}
