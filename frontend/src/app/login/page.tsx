'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません');
      setLoading(false);
      return;
    }

    router.push('/log');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-paper rounded-xl p-10 w-[360px] border border-border shadow-sm">
        <h1 className="text-[20px] font-semibold text-ink mb-8">Inner Trace</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] text-ink-light">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="px-3 py-2 border border-border rounded text-[13px] text-ink bg-bg outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] text-ink-light">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="px-3 py-2 border border-border rounded text-[13px] text-ink bg-bg outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <p className="font-mono text-[12px] text-problem">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2 bg-ink text-bg text-[13px] rounded hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? '...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
