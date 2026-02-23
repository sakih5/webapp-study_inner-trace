'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusContextValue {
  status: SaveStatus;
  setSaving: () => void;
  setSaved: () => void;
  setError: () => void;
}

const SaveStatusContext = createContext<SaveStatusContextValue | null>(null);

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SaveStatus>('idle');

  const setSaving = useCallback(() => setStatus('saving'), []);

  const setSaved = useCallback(() => {
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 3000);
  }, []);

  const setError = useCallback(() => setStatus('error'), []);

  return (
    <SaveStatusContext.Provider value={{ status, setSaving, setSaved, setError }}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus() {
  const ctx = useContext(SaveStatusContext);
  if (!ctx) throw new Error('useSaveStatus must be used within SaveStatusProvider');
  return ctx;
}
