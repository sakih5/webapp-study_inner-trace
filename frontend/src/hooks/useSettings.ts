import useSWR from 'swr';
import { fetcher, api } from '@/lib/api';
import type { UserOption } from '@/lib/types';

export function useSettings(optionType: UserOption['option_type']) {
  const { data, error, mutate } = useSWR<UserOption[]>(
    `/settings/options?type=${optionType}`,
    fetcher,
  );

  const options = data ?? [];
  const isLoading = !data && !error;

  const add = async (label: string) => {
    // 楽観的更新: 末尾に仮エントリを追加
    const tempId = crypto.randomUUID();
    await mutate(
      [...options, { id: tempId, option_type: optionType, label, sort_order: options.length }],
      false,
    );
    await api.post<UserOption>('/settings/options', { option_type: optionType, label });
    await mutate();
  };

  const remove = async (id: string) => {
    await mutate(options.filter(o => o.id !== id), false);
    await api.delete(`/settings/options/${id}`);
    await mutate();
  };

  return { options, isLoading, error, add, remove };
}
