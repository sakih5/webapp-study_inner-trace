export function TableSkeleton() {
  return (
    <div className="mb-6">
      {/* 週ヘッダー */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-ink mb-2">
        <div className="shimmer h-[16px] w-[200px] rounded" />
        <div className="shimmer h-[24px] w-[56px] rounded" />
      </div>

      {/* 日付ラベル */}
      <div className="px-3 mb-1 pb-1">
        <div className="shimmer h-[14px] w-[160px] rounded" />
      </div>

      {/* テーブル行 */}
      <div className="rounded-lg overflow-hidden border border-border mx-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-2 py-2.5 ${i % 2 === 0 ? 'bg-bg' : 'bg-paper'}`}
          >
            <div className="shimmer h-[12px] w-[90px] rounded" />
            <div className="shimmer h-[12px] w-[90px] rounded" />
            <div className="shimmer h-[12px] flex-1 rounded" />
            <div className="shimmer h-[12px] w-[100px] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
