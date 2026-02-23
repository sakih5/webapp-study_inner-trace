'use client';

import { useState, type ReactNode } from 'react';
import type { WeekRange } from '@/lib/types';
import { CopyButton } from './CopyButton';

interface WeekGroupProps {
  week: WeekRange;
  defaultOpen?: boolean;
  onCopy: () => string;
  children: ReactNode;
}

export function WeekGroup({ week, defaultOpen = false, onCopy, children }: WeekGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none border-b-2 border-ink"
        onClick={() => setIsOpen(v => !v)}
      >
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <span className="text-[10px]">{isOpen ? '▼' : '▶'}</span>
          <span>📅 {week.label}</span>
        </div>
        {/* CopyButton はクリックがWeekGroupのトグルに伝播しないよう stopPropagation */}
        <div onClick={e => e.stopPropagation()}>
          <CopyButton getText={onCopy} />
        </div>
      </div>

      {/* Collapsible content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? '2000px' : '0px' }}
      >
        <div className="py-2">{children}</div>
      </div>
    </div>
  );
}
