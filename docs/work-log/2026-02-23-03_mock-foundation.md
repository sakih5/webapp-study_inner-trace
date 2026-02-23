# 作業ログ 2026-02-23-03 — モック基盤構築（WBS 1.3）

## やったこと

### 作成ファイル一覧

| ファイル | 役割 |
|---------|------|
| `src/lib/types.ts` | 共有型定義（LogEntry / RetroEntry / UserOption / WeekRange） |
| `src/mocks/data.ts` | サンプルデータ（ログ13件・振り返り6件・オプション17件） |
| `src/mocks/store.ts` | インメモリ CRUD ストア |
| `src/lib/api.ts` | fetcher と api（モック↔実API切り替え） |
| `src/proxy.ts` | ルートガード（Next.js 16 形式） |
| `frontend/.env.local` | `NEXT_PUBLIC_USE_MOCK=true` |

### モックデータの設計

今日（2026-02-23 月曜）を起点に3週分のサンプルデータを作成：
- 今週（2026-02-23〜）: ログ2件
- 先週（2026-02-16〜22）: ログ8件・振り返り4件
- 先々週（2026-02-09〜15）: ログ3件・振り返り2件

感情オプション10種・振り返りタイプ4種・カテゴリ3種を定義。

### モックストアの設計

`store.ts` はブラウザ側でのみ使うモジュールレベルシングルトン。ページリロードで初期データにリセットされる（モック用途として許容）。

`api.ts` からは動的 import（`await import('@/mocks/store')`）でアクセスすることで、SSR 時のサーバーサイド実行を回避している。

### API 切り替えロジック

```typescript
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
```

- `true` の場合: モックストアを呼び出す（50ms のダミー遅延を挟む）
- `false` の場合: `NEXT_PUBLIC_API_BASE_URL` に実際の fetch を行う

`fetcher` は SWR 用、`api.post / api.patch / api.delete` はミューテーション用として分離。

### ルートガード（proxy.ts）

- モック時: 認証チェックをスキップ。`/` → `/log` へリダイレクト
- 本番時: 空実装（Phase 5 で Supabase Auth を組み込む）

## 決定事項

- `NEXT_PUBLIC_USE_MOCK=true` がデフォルト。本番接続時は `.env.local` を書き換える
- モックの遅延は50ms（ローディング状態の動作確認ができる程度）
- `proxy.ts` の matcher は `_next/static`・`_next/image`・`favicon.ico` を除く全パスに適用

## メモ

- Next.js 16 では `middleware.ts` / `export function middleware` が非推奨になり `proxy.ts` / `export function proxy` に変更されている
- `NEXT_PUBLIC_*` 変数はビルド時にインライン化されるため proxy.ts（Edge ランタイム）でも参照可能
