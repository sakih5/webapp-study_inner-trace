import useSWRInfinite from 'swr/infinite';
import { fetcher, api } from '@/lib/api';
import { fmt, today, getWeekRange } from '@/lib/dateUtils';
import type { LogEntry } from '@/lib/types';

function getPageRange(pageIndex: number): { from: string; to: string } {
  const todayWeek = getWeekRange(today());
  // 今週の日曜日を基点に、pageIndex × 14日ずつ遡る
  const toDate = new Date(todayWeek.to + 'T12:00:00');
  toDate.setDate(toDate.getDate() - pageIndex * 14);
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 13); // 2週間分
  return { from: fmt(fromDate), to: fmt(toDate) };
}

export function useLog() {
  const { data, error, size, setSize, mutate } = useSWRInfinite<LogEntry[]>(
    (pageIndex, previousPageData) => {
      // 前ページが空ならそれ以上読み込まない
      if (previousPageData && previousPageData.length === 0) return null;
      const { from, to } = getPageRange(pageIndex);
      return `/log?from=${from}&to=${to}`;
    },
    fetcher,
  );

  const entries: LogEntry[] = data ? data.flat() : [];
  const isLoading = !data && !error;
  const isLoadingMore =
    size > 0 && data !== undefined && typeof data[size - 1] === 'undefined';
  const hasMore = !data || (data[data.length - 1]?.length ?? 0) > 0;

  const loadMore = () => setSize(size + 1);

  const add = async (entry: Omit<LogEntry, 'id' | 'created_at' | 'updated_at'>) => {
    const newEntry = await api.post<LogEntry>('/log', entry);
    await mutate();
    return newEntry;
  };

  const update = async (id: string, patch: Partial<LogEntry>) => {
    // 楽観的更新
    await mutate(
      data?.map(page => page.map(e => (e.id === id ? { ...e, ...patch } : e))),
      false,
    );
    try {
      await api.patch(`/log/${id}`, patch);
      await mutate();
    } catch (err) {
      await mutate(); // ロールバック
      throw err;
    }
  };

  const remove = async (id: string) => {
    await mutate(
      data?.map(page => page.filter(e => e.id !== id)),
      false,
    );
    await api.delete(`/log/${id}`);
    await mutate();
  };

  const retry = () => mutate();

  return { entries, isLoading, error, isLoadingMore, hasMore, loadMore, add, update, remove, retry };
}
