import useSWRInfinite from 'swr/infinite';
import { fetcher, api } from '@/lib/api';
import { fmt, today, getWeekRange } from '@/lib/dateUtils';
import type { RetroEntry } from '@/lib/types';

function getPageRange(pageIndex: number): { from: string; to: string } {
  const todayWeek = getWeekRange(today());
  const toDate = new Date(todayWeek.to + 'T12:00:00');
  toDate.setDate(toDate.getDate() - pageIndex * 14);
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 13);
  return { from: fmt(fromDate), to: fmt(toDate) };
}

export function useRetro() {
  const { data, error, size, setSize, mutate } = useSWRInfinite<RetroEntry[]>(
    (pageIndex, previousPageData) => {
      if (previousPageData && previousPageData.length === 0) return null;
      const { from, to } = getPageRange(pageIndex);
      return `/retro?from=${from}&to=${to}`;
    },
    fetcher,
  );

  const entries: RetroEntry[] = data ? data.flat() : [];
  const isLoading = !data && !error;
  const isLoadingMore =
    size > 0 && data !== undefined && typeof data[size - 1] === 'undefined';
  const hasMore = !data || (data[data.length - 1]?.length ?? 0) > 0;

  const loadMore = () => setSize(size + 1);

  const add = async (entry: Omit<RetroEntry, 'id' | 'created_at' | 'updated_at'>) => {
    const newEntry = await api.post<RetroEntry>('/retro', entry);
    await mutate();
    return newEntry;
  };

  const update = async (id: string, patch: Partial<RetroEntry>) => {
    await mutate(
      data?.map(page => page.map(e => (e.id === id ? { ...e, ...patch } : e))),
      false,
    );
    try {
      await api.patch(`/retro/${id}`, patch);
      await mutate();
    } catch (err) {
      await mutate();
      throw err;
    }
  };

  const remove = async (id: string) => {
    await mutate(
      data?.map(page => page.filter(e => e.id !== id)),
      false,
    );
    await api.delete(`/retro/${id}`);
    await mutate();
  };

  const retry = () => mutate();

  return { entries, isLoading, error, isLoadingMore, hasMore, loadMore, add, update, remove, retry };
}
