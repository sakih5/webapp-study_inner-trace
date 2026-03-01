'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import useSWR from 'swr';
import { useRetro } from '@/hooks/useRetro';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { WeekGroup } from '@/components/shared/WeekGroup';
import { RetroRow } from '@/components/retro/RetroRow';
import { AddRetroModal } from '@/components/retro/AddRetroModal';
import { groupByWeek, groupByDate, formatDateLabel, today } from '@/lib/dateUtils';
import { sortRetroEntries } from '@/lib/logUtils';
import { buildRetroText } from '@/lib/export';
import { fetcher } from '@/lib/api';
import type { RetroEntry, UserOption } from '@/lib/types';

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

  const [modal, setModal] = useState<{ initialDate: string } | null>(null);
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

  const openModal = (date: string) => setModal({ initialDate: date });
  const closeModal = () => setModal(null);

  const handleModalSave = async (entry: Omit<RetroEntry, 'id' | 'created_at' | 'updated_at'>) => {
    await add(entry);
    closeModal();
  };

  const sorted = sortRetroEntries(entries);
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
        <button
          onClick={() => openModal(today())}
          className="font-mono text-[11px] px-3 py-1.5 bg-ink text-bg rounded hover:opacity-80 transition-opacity"
        >
          ＋ 振り返りを追加
        </button>
      </div>

      {grouped.size === 0 && (
        <p className="text-ink-light font-mono text-[12px]">データなし</p>
      )}

      {/* 週グループ */}
      {[...grouped.entries()].map(([weekKey, { week, entries: weekEntries }]) => {
        const byDate = groupByDate(sortRetroEntries(weekEntries));

        return (
          <WeekGroup
            key={weekKey}
            week={week}
            defaultOpen={weekKey === latestWeekKey}
            onCopy={() => buildRetroText(weekEntries, week.label)}
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
                            <Fragment key={entry.id}>
                              <InsertRow onClick={() => openModal(date)} />
                              <RetroRow
                                entry={entry}
                                typeOptions={typeOptions}
                                categoryOptions={categoryOptions}
                                isOdd={idx % 2 === 0}
                                onUpdate={(id, patch) => update(id, patch)}
                                onDelete={(id) => remove(id)}
                              />
                            </Fragment>
                          ))}
                          <InsertRow onClick={() => openModal(date)} />
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

      {/* 新規追加モーダル */}
      {modal && (
        <AddRetroModal
          initialDate={modal.initialDate}
          typeOptions={typeOptions}
          categoryOptions={categoryOptions}
          onSave={handleModalSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function InsertRow({ onClick }: { onClick: () => void }) {
  return (
    <tr className="group/insert cursor-pointer" onClick={onClick}>
      <td colSpan={4} className="px-3 py-0.5">
        <div className="opacity-0 group-hover/insert:opacity-100 flex items-center gap-1 transition-opacity">
          <div className="flex-1 h-px bg-accent" />
          <span className="font-mono text-[9px] text-accent leading-none">＋</span>
          <div className="flex-1 h-px bg-accent" />
        </div>
      </td>
    </tr>
  );
}
