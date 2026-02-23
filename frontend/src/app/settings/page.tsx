'use client';

import { useSettings } from '@/hooks/useSettings';
import { OptionList } from '@/components/settings/OptionList';
import type { UserOption } from '@/lib/types';

function SettingsSection({
  title,
  optionType,
}: {
  title: string;
  optionType: UserOption['option_type'];
}) {
  const { options, isLoading, add, remove } = useSettings(optionType);

  return (
    <div className="mb-8">
      <h2 className="text-[13px] font-semibold text-ink mb-3">{title}</h2>
      <div className="bg-paper rounded-lg px-4 py-3 border border-border">
        {isLoading ? (
          <p className="text-ink-light font-mono text-[12px]">読み込み中...</p>
        ) : (
          <OptionList options={options} onAdd={add} onRemove={remove} />
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-[16px] font-semibold text-ink mb-6">設定</h1>
      <SettingsSection title="振り返りタイプオプション" optionType="retro_type" />
      <SettingsSection title="振り返りカテゴリオプション" optionType="retro_category" />
    </div>
  );
}
