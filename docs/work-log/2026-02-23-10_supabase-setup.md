# 作業ログ 2026-02-23-10 — Supabase セットアップ（フェーズ2）

## やったこと

### supabase/schema.sql の作成・実行

設計書 §3 の SQL 全文を `supabase/schema.sql` として作成し、Supabase SQL Editor で実行。

**実行内容:**
- `log_entries` テーブル（行動・感情記録）+ インデックス
- `retro_entries` テーブル（振り返り）+ インデックス
- `user_options` テーブル（感情・タイプ・カテゴリ共通）+ インデックス
- `update_updated_at()` トリガー関数（log_entries・retro_entries に適用）
- RLS ポリシー（全テーブル `user_id = auth.uid()`）
- `handle_new_user()` トリガー（ユーザー登録時に17件の初期オプションをシード）

### フロントエンド .env.local の更新

```
NEXT_PUBLIC_SUPABASE_URL=https://svbqeyjeuepzuluqjmwz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Publishable API Key>
```

`NEXT_PUBLIC_USE_MOCK=true` は維持（バックエンド完成まではモードを切り替えない）。

## 確認事項

- Data API（PostgREST）はこのプロジェクトでは使用しない
  - フロントエンド → Express バックエンド → Supabase（service role key）の構成のため
- Supabase Auth でのユーザー作成はバックエンド実装後に行う

## 次回やること

**フェーズ3: バックエンド実装（WBS B.1〜B.7）**

```bash
backend/
  src/
    index.ts          # Express・CORS
    middleware/
      auth.ts         # JWT検証（supabase.auth.getUser）
      validate.ts     # リクエストバリデーション
    routes/
      log.ts          # 行動記録 CRUD
      retro.ts        # 振り返り CRUD
      settings.ts     # オプション CRUD
  package.json
  tsconfig.json
  .env
  Dockerfile
```

Secret API Key を `backend/.env` に設定してから開始。
