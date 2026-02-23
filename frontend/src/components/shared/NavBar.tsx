'use client';

import { usePathname, useRouter } from 'next/navigation';

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab =
    pathname.startsWith('/retro') ? 'retro' :
    pathname.startsWith('/settings') ? 'settings' :
    'log';

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

  return (
    <nav className="fixed top-0 left-0 right-0 h-[54px] z-[200] bg-bg border-b border-border flex items-center px-4 gap-4">
      {/* Logo */}
      <span className="text-[17px] font-semibold shrink-0 select-none">
        Inner Trace
      </span>

      {/* Tab switcher */}
      <div className="flex bg-paper rounded-full p-1 gap-1">
        <button
          onClick={() => router.push('/log')}
          className={`text-xs py-1 px-3 rounded-full transition-all whitespace-nowrap ${
            activeTab === 'log'
              ? 'bg-bg shadow text-ink font-medium'
              : 'text-ink-light hover:text-ink'
          }`}
        >
          行動・感情記録
        </button>
        <button
          onClick={() => router.push('/retro')}
          className={`text-xs py-1 px-3 rounded-full transition-all whitespace-nowrap ${
            activeTab === 'retro'
              ? 'bg-bg shadow text-ink font-medium'
              : 'text-ink-light hover:text-ink'
          }`}
        >
          振り返り
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Date + Settings */}
      <div className="flex items-center gap-3">
        <span className="hidden md:block font-mono text-[12px] text-ink-light">
          {dateStr}
        </span>
        <button
          onClick={() => router.push('/settings')}
          className="text-ink-light hover:text-ink transition-colors text-[18px] leading-none"
          aria-label="設定"
        >
          ⚙
        </button>
      </div>
    </nav>
  );
}
