# 作業ログ 2026-02-23-12 — フェーズ4 統合作業（未完了）

## やったこと

### フロントエンド側の整備（完了）

- `@supabase/ssr` / `@supabase/supabase-js` をインストール
- `src/lib/supabase.ts` 作成（`createClient()` ファクトリ関数）
- `src/app/page.tsx` → `/log` リダイレクト（デフォルトページを置き換え）
- `src/proxy.ts` → Supabase Auth によるルートガード実装
  - 未ログイン → `/login` リダイレクト
  - ログイン済みで `/login` → `/log` リダイレクト
- `src/lib/api.ts` → 全リクエストに `Authorization: Bearer <jwt>` ヘッダーを付加
  - `supabase.auth.getSession()` でトークン取得
  - **シングルトンではなく `createClient()` を毎回呼ぶ**（SSR時の初期化問題を回避）
- `src/app/login/page.tsx` → `supabase.auth.signInWithPassword()` で実際のログイン

### 確認済み

- ログイン画面表示 ✓
- メール＋パスワードでのログイン成功 ✓
- ログイン後 `/log` へ遷移 ✓
- `getSession()` は正常にセッション（access_token）を返している ✓
- リクエストは `http://localhost:8080/v1/log?from=...` に飛んでいる ✓

## 未解決の問題: 401 Unauthorized

### 現象

```
GET http://localhost:8080/v1/log?from=2026-02-16&to=2026-03-01 401 (Unauthorized)
GET http://localhost:8080/v1/settings/options?type=emotion 401 (Unauthorized)
```

### 調査過程

1. **`supabase.auth.getUser(token)` 方式（当初実装）**
   - バックエンドログ: `AuthRetryableFetchError: fetch failed`
   - WSL2 の Node.js fetch から Supabase への HTTP リクエストが失敗
   - `curl` では同じ URL に正常接続できるため、Node.js fetch の挙動が異なる

2. **`jose` + `createRemoteJWKSet` 方式**
   - JWKS エンドポイントへのアクセスも `fetch failed` で失敗
   - curl は成功するが Node.js fetch が失敗するパターンが継続

3. **ローカル JWT デコード方式（現在の実装）**
   - `Buffer.from(parts[1], 'base64url')` で JWT ペイロードを直接デコード
   - ネットワーク呼び出し不要
   - 有効期限（`exp`）チェックのみ実施
   - **それでも 401 が返る → バックエンドがリロードされていない可能性**

### 現在の `auth.ts` の実装（ネットワーク不要版）

```typescript
function decodeJwtPayload(token: string): { sub?: string; exp?: number } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
  return JSON.parse(payload);
}
```

## 次回の起点

以下を順番に確認する：

1. **バックエンドを手動で再起動**（`Ctrl+C` → `npm run dev`）し、最新の auth.ts が反映されているか確認
2. バックエンドのターミナルに `[AUTH]` 関連のログが出るか確認
3. バックエンドのターミナルに起動メッセージ（`Server running on port 8080`）が出ているか確認
4. curl でバックエンドのヘルスチェック: `curl http://localhost:8080/health`

### Node.js fetch 問題の根本原因候補

- WSL2 の HTTP プロキシ設定が curl には効いているが Node.js には効いていない
- Node.js のデフォルト CA ストアの問題（`NODE_EXTRA_CA_CERTS` で解決できる場合あり）
- `HTTPS_PROXY` 環境変数を設定すれば解決できる可能性

### 最悪ローカルデコードでも直らない場合

`auth.ts` に以下を追加してログ確認：

```typescript
console.log('[AUTH] token received, length:', token.length);
console.log('[AUTH] payload:', payload);
```

これで auth ミドルウェアが呼ばれているかと、デコード結果を確認できる。
