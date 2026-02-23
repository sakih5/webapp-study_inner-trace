'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { useRetro } from '@/hooks/useRetro';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { WeekGroup } from '@/components/shared/WeekGroup';
import { RetroRow } from '@/components/retro/RetroRow';
import { groupByWeek, groupByDate, formatDateLabel, today } from '@/lib/dateUtils';
import { sortRetroEntries } from '@/lib/logUtils';
import { buildRetroText } from '@/lib/export';
import { fetcher } from '@/lib/api';
import type { RetroEntry, UserOption } from '@/lib/types';

type ProvisionalEntry = Omit<RetroEntry, 'id' | 'content'>;

export default function RetroPage() {
  const { entries, isLoading, error, isLoadingMore, hasMore, loadMore, add, update, remove, retry } =
    useRetro();
  const { data: typeOptions = [] } = useSWR<UserOption[]>(
    '/settings/options?type=retro_type',
    fetcher,
  );
  const { data: categoryOptions = [] } = useSWR<UserOption[]>(
    '/settings/options?type=retro_category',
    fetcher,
  );

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

  const defaultType = typeOptions[0]?.label ?? '';
  const defaultCategory = categoryOptions[0]?.label ?? '';

  const handleAddRow = () => {
    if (provisional) return;
    setProvisional({ date: today(), type: defaultType, category: defaultCategory });
  };

  const handleProvisionalUpdate = (patch: Partial<RetroEntry>) => {
    setProvisional(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const handleProvisionalContent = async (content: string) => {
    if (!provisional) return;
    if (!content.trim()) { setProvisional(null); return; }
    await add({
      date: provisional.date,
      type: provisional.type || defaultType,
      category: provisional.category || defaultCategory,
      content: content.trim(),
    });
    setProvisional(null);
  };

  // 仮行を通常エントリと同じ形で混ぜてグルーピング
  const provisionalAsEntry: RetroEntry | null = provisional
    ? { id: '__provisional__', content: '', ...provisional }
    : null;
  const allEntries = provisionalAsEntry ? [provisionalAsEntry, ...entries] : entries;

  const sorted = sortRetroEntries(allEntries);
  const grouped = groupByWeek(sorted);
  const weekKeys = [...grouped.keys()];
  const latestWeekKey = weekKeys[0];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="shimmer h-5 w-24 rounded" />
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
        <h1 className="text-[16px] font-semibold text-ink">振り返り</h1>
        {!provisional && (
          <button
            onClick={handleAddRow}
            className="font-mono text-[11px] px-3 py-1.5 bg-ink text-bg rounded hover:opacity-80 transition-opacity"
          >
            ＋ 振り返りを追加
          </button>
        )}
      </div>

      {grouped.size === 0 && (
        <p className="text-ink-light font-mono text-[12px]">データなし</p>
      )}

      {/* 週グループ */}
      {[...grouped.entries()].map(([weekKey, { week, entries: weekEntries }]) => {
        const realEntries = weekEntries.filter(e => e.id !== '__provisional__');
        const byDate = groupByDate(sortRetroEntries(weekEntries));

        return (
          <WeekGroup
            key={weekKey}
            week={week}
            defaultOpen={weekKey === latestWeekKey}
            onCopy={() => buildRetroText(realEntries, week.label)}
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
                    <div className="rounded-lg overflow-hidden border border-border min-w-[360px]">
                    <table className="w-full table-fixed text-[12px]">
                      <thead>
                        <tr className="bg-paper border-b border-border">
                          <th className="font-mono text-[9px] uppercase tracking-wider text-ink-light text-left px-2 py-1.5 w-[110px]">Type</th>
                          <th className="font-mono text-[9px] uppercase tracking-wider text-ink-light text-left px-2 py-1.5 w-[90px]">Category</th>
                          <th className="font-mono text-[9px] uppercase tracking-wider text-ink-light text-left px-2 py-1.5">Content</th>
                          <th className="w-[40px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {dateEntries.map((entry, idx) => (
                          <RetroRow
                            key={entry.id}
                            entry={entry}
                            typeOptions={typeOptions}
                            categoryOptions={categoryOptions}
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
                            onProvisionalContent={
                              entry.id === '__provisional__'
                                ? handleProvisionalContent
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
