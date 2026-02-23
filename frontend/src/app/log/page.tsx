'use client';

import { useState, useRef, useEffect } from 'react';
import { useLog } from '@/hooks/useLog';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { WeekGroup } from '@/components/shared/WeekGroup';
import { LogRow } from '@/components/log/LogRow';
import { groupByWeek, groupByDate, formatDateLabel, today } from '@/lib/dateUtils';
import { sortLogEntries } from '@/lib/logUtils';
import { buildLogText } from '@/lib/export';
import type { LogEntry } from '@/lib/types';

type ProvisionalEntry = Omit<LogEntry, 'id' | 'action'>;

export default function LogPage() {
  const { entries, isLoading, error, isLoadingMore, hasMore, loadMore, add, update, remove, retry } =
    useLog();
  const [provisional, setProvisional] = useState<ProvisionalEntry | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 無限スクロール
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !isLoadingMore && hasMore) loadMore(); },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, hasMore, loadMore]);

  const handleAddRow = () => {
    if (provisional) return;
    setProvisional({ date: today(), start_time: null, end_time: null, emotion: null });
  };

  const handleProvisionalUpdate = (patch: Partial<LogEntry>) => {
    setProvisional(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const handleProvisionalAction = async (action: string) => {
    if (!provisional) return;
    if (!action.trim()) { setProvisional(null); return; }
    await add({
      date: provisional.date,
      start_time: provisional.start_time,
      end_time: provisional.end_time,
      action: action.trim(),
      emotion: provisional.emotion,
    });
    setProvisional(null);
  };

  // 仮行を通常エントリと同じ形で混ぜてグルーピング
  const provisionalAsEntry: LogEntry | null = provisional
    ? { id: '__provisional__', action: '', ...provisional }
    : null;
  const allEntries = provisionalAsEntry ? [provisionalAsEntry, ...entries] : entries;

  const sorted = sortLogEntries(allEntries);
  const grouped = groupByWeek(sorted);
  const weekKeys = [...grouped.keys()];
  const latestWeekKey = weekKeys[0];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="shimmer h-[20px] w-[120px] rounded" />
        </div>
        <TableSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="font-mono text-[12px] text-problem mb-3">データを取得できませんでした。</p>
        <button
          onClick={retry}
          className="font-mono text-[11px] px-3 py-1.5 border border-border rounded hover:bg-paper transition-colors text-ink"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[16px] font-semibold text-ink">行動・感情記録</h1>
        {!provisional && (
          <button
            onClick={handleAddRow}
            className="font-mono text-[11px] px-3 py-1.5 bg-ink text-bg rounded hover:opacity-80 transition-opacity"
          >
            ＋ 記録を追加
          </button>
        )}
      </div>

      {grouped.size === 0 && (
        <p className="text-ink-light font-mono text-[12px]">データなし</p>
      )}

      {/* 週グループ */}
      {[...grouped.entries()].map(([weekKey, { week, entries: weekEntries }]) => {
        const realEntries = weekEntries.filter(e => e.id !== '__provisional__');
        const byDate = groupByDate(sortLogEntries(weekEntries));

        return (
          <WeekGroup
            key={weekKey}
            week={week}
            defaultOpen={weekKey === latestWeekKey}
            onCopy={() => buildLogText(realEntries, week.label)}
          >
            {Object.entries(byDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, dateEntries]) => (
                <div key={date} className="mb-4">
                  {/* 日付ラベル */}
                  <div className="px-3 py-1 text-[13px] font-semibold text-ink-light border-b border-border mb-1">
                    {formatDateLabel(date)}
                  </div>

                  {/* テーブル（モバイルは横スクロール） */}
                  <div className="overflow-x-auto mx-2">
                    <div className="rounded-lg overflow-hidden border border-border min-w-[480px]">
                    <table className="w-full table-fixed text-[12px]">
                      <thead>
                        <tr className="bg-paper border-b border-border">
                          <th className="font-mono text-[9px] uppercase tracking-wider text-ink-light text-left px-2 py-1.5 w-[90px]">Start</th>
                          <th className="font-mono text-[9px] uppercase tracking-wider text-ink-light text-left px-2 py-1.5 w-[90px]">End</th>
                          <th className="font-mono text-[9px] uppercase tracking-wider text-ink-light text-left px-2 py-1.5">Action</th>
                          <th className="font-mono text-[9px] uppercase tracking-wider text-ink-light text-left px-2 py-1.5">Emotion</th>
                          <th className="w-[40px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {dateEntries.map((entry, idx) => (
                          <LogRow
                            key={entry.id}
                            entry={entry}
                            isOdd={idx % 2 === 0}
                            isProvisional={entry.id === '__provisional__'}
                            onUpdate={(id, patch) =>
                              id === '__provisional__'
                                ? handleProvisionalUpdate(patch)
                                : update(id, patch)
                            }
                            onDelete={(id) =>
                              id === '__provisional__'
                                ? setProvisional(null)
                                : remove(id)
                            }
                            onProvisionalAction={
                              entry.id === '__provisional__'
                                ? handleProvisionalAction
                                : undefined
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                </div>
              ))}
          </WeekGroup>
        );
      })}

      {/* 無限スクロールのセンチネル */}
      <div ref={sentinelRef} className="py-4 flex justify-center">
        {isLoadingMore && (
          <span className="font-mono text-[11px] text-ink-light">読み込み中...</span>
        )}
      </div>
    </div>
  );
}
