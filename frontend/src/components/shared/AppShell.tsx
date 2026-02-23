'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from './NavBar';
import { SaveStatusIndicator } from './SaveStatusIndicator';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login');

  return (
    <>
      {!isAuthPage && <NavBar />}
      <main className={isAuthPage ? 'min-h-screen' : 'pt-[54px]'}>
        {children}
      </main>
      {!isAuthPage && <SaveStatusIndicator />}
    </>
  );
}
