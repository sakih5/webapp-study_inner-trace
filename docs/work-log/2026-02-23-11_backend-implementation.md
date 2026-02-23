# 作業ログ 2026-02-23-11 — バックエンド実装（フェーズ3 B.1〜B.7）

## やったこと

### WBS B.1: プロジェクト初期化

`backend/` ディレクトリに以下を作成:

- `package.json` — Express 5 + Supabase JS + dotenv + cors + tsx（開発時ホットリロード）
- `tsconfig.json` — target: ES2020, module: CommonJS, strict: true
- `npm install` 完了（98 packages）

### WBS B.2: 共通基盤

- `src/db/supabase.ts` — service role key でクライアント初期化（RLS バイパス、autoRefreshToken/persistSession: false）
- `src/index.ts` — Express サーバー、CORS（ALLOWED_ORIGINS 環境変数 + development 時は localhost:3000 自動追加）、ルート登録、グローバルエラーハンドラー

### WBS B.3: 認証ミドルウェア

- `src/middleware/auth.ts` — `Authorization: Bearer <jwt>` を `supabase.auth.getUser(token)` で検証し `req.userId` を設定

### WBS B.4: バリデーションミドルウェア

- `src/middleware/validate.ts` — 各エンドポイント用バリデーション関数
  - `validateLogPost` / `validateLogPatch`
  - `validateRetroPost` / `validateRetroPatch`
  - `validateOptionPost`
  - 時刻: HH:MM, 05:00〜29:50, 10分刻み検証
  - 文字列: 最大5000字、空文字拒否

### WBS B.5: 行動記録 API

- `src/routes/log.ts` — GET/POST/PATCH/DELETE
  - PATCH/DELETE は所有権確認（user_id 一致チェック）
  - 許可フィールドのみ update に含める

### WBS B.6: 振り返り API

- `src/routes/retro.ts` — GET/POST/PATCH/DELETE（log.ts と同構造）

### WBS B.7: 設定 API

- `src/routes/settings.ts` — GET/POST/DELETE
  - sort_order: `MAX(sort_order) + 1` で末尾採番

### その他

- `backend/Dockerfile` — マルチステージビルド（builder: tsc, runner: node dist/index.js）
- `backend/.env` に `ALLOWED_ORIGINS=http://localhost:3000` 追加
- `.gitignore`（ルート）作成 — `backend/.env`, `frontend/.env.local`, node_modules, dist を除外

## 確認済み

- `npx tsc --noEmit` → エラーなし
- `npm run dev` → `Server running on port 8080` 起動確認

## 次回やること

**フェーズ4: フロントエンド・バックエンド統合（WBS C.1〜C.3）**

1. Supabase Auth でユーザー作成（ダッシュボード → Authentication → Users）
2. `NEXT_PUBLIC_USE_MOCK=false` に切り替え
3. フロントエンドから実APIへの疎通確認

```bash
# バックエンド起動
cd backend && npm run dev   # localhost:8080

# フロントエンド起動
cd frontend && npm run dev  # localhost:3000
```
