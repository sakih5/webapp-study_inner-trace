import type { LogEntry, RetroEntry, UserOption } from './types';
import { createClient } from './supabase';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

// モックストアは動的importでSSR時のNode.js互換性を保つ
async function getMockStore() {
  const { mockLogStore, mockRetroStore, mockOptionsStore } = await import('@/mocks/store');
  return { mockLogStore, mockRetroStore, mockOptionsStore };
}

function parseMockUrl(url: string): { path: string; params: URLSearchParams } {
  const [path, query] = url.split('?');
  return { path, params: new URLSearchParams(query ?? '') };
}

async function mockGet(url: string): Promise<unknown> {
  const { path, params } = parseMockUrl(url);
  const { mockLogStore, mockRetroStore, mockOptionsStore } = await getMockStore();

  if (path === '/log') {
    return mockLogStore.getByRange(params.get('from')!, params.get('to')!);
  }
  if (path === '/retro') {
    return mockRetroStore.getByRange(params.get('from')!, params.get('to')!);
  }
  if (path === '/settings/options') {
    return mockOptionsStore.getByType(params.get('type') as UserOption['option_type']);
  }
  throw new Error(`Unknown mock path: ${path}`);
}

const delay = () => new Promise(r => setTimeout(r, 50));

// SWR fetcher
export async function fetcher<T>(url: string): Promise<T> {
  if (USE_MOCK) {
    await delay();
    return mockGet(url) as Promise<T>;
  }
  const res = await fetch(`${API_BASE}${url}`, {
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ミューテーション用 API クライアント
export const api = {
  async post<T>(url: string, body: unknown): Promise<T> {
    if (USE_MOCK) {
      await delay();
      const { mockLogStore, mockRetroStore, mockOptionsStore } = await getMockStore();
      if (url === '/log') {
        return mockLogStore.add(body as Omit<LogEntry, 'id' | 'created_at' | 'updated_at'>) as T;
      }
      if (url === '/retro') {
        return mockRetroStore.add(body as Omit<RetroEntry, 'id' | 'created_at' | 'updated_at'>) as T;
      }
      if (url === '/settings/options') {
        const { option_type, label } = body as { option_type: UserOption['option_type']; label: string };
        return mockOptionsStore.add(option_type, label) as T;
      }
      throw new Error(`Unknown mock POST path: ${url}`);
    }
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async patch<T>(url: string, body: unknown): Promise<T> {
    if (USE_MOCK) {
      await delay();
      const { mockLogStore, mockRetroStore } = await getMockStore();
      const match = url.match(/^\/(log|retro)\/(.+)$/);
      if (!match) throw new Error(`Unknown mock PATCH path: ${url}`);
      const [, resource, id] = match;
      if (resource === 'log') return mockLogStore.update(id, body as Partial<LogEntry>) as T;
      if (resource === 'retro') return mockRetroStore.update(id, body as Partial<RetroEntry>) as T;
      throw new Error(`Unknown mock PATCH resource: ${resource}`);
    }
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(url: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const { mockLogStore, mockRetroStore, mockOptionsStore } = await getMockStore();
      const logMatch = url.match(/^\/log\/(.+)$/);
      const retroMatch = url.match(/^\/retro\/(.+)$/);
      const optionMatch = url.match(/^\/settings\/options\/(.+)$/);
      if (logMatch)   { mockLogStore.remove(logMatch[1]);     return; }
      if (retroMatch) { mockRetroStore.remove(retroMatch[1]); return; }
      if (optionMatch){ mockOptionsStore.remove(optionMatch[1]); return; }
      throw new Error(`Unknown mock DELETE path: ${url}`);
    }
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
  },
};
