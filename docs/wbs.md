# WBS — Inner Trace

## フェーズ1: モック実装 ✅ 完了

### 1. 環境構築

- [x] 1.1 Next.jsプロジェクト初期化
  - `create-next-app`（App Router・TypeScript・Tailwind）、ESLint設定
- [x] 1.2 デザインシステム設定
  - CSS変数（カラーパレット）、Inter + Noto Sans JP + Source Code Pro、Tailwind v4設定
- [x] 1.3 モック基盤構築
  - `src/mocks/data.ts`（サンプルデータ）、モックfetcher、`NEXT_PUBLIC_USE_MOCK` 切り替え

### 2. 共通コンポーネント

- [x] 2.1 NavBar
- [x] 2.2 保存ステータスインジケーター（SaveStatusContext）
- [x] 2.3 WeekGroup
- [x] 2.4 ExpandableCell（IMEデバウンス・visualViewport追従）
- [x] 2.5 CopyButton

### 3. 行動記録画面 (`/log`)

- [x] 3.1 useLog（useSWRInfinite・楽観的更新）
- [x] 3.2 ページ骨格・グルーピング
- [x] 3.3 LogRow（時間select・感情select孤立値対応）
- [x] 3.4 仮行追加フロー
- [x] 3.5 無限スクロール（IntersectionObserver）

### 4. 振り返り画面 (`/retro`)

- [x] 4.1 useRetro
- [x] 4.2 ページ骨格
- [x] 4.3 RetroRow（タイプ・カテゴリselect孤立値対応）
- [x] 4.4 仮行追加フロー

### 5. 設定画面 (`/settings`)

- [x] 5.1 useSettings（3種類独立キャッシュ）
- [x] 5.2 OptionList（追加・削除確認ダイアログ・楽観的更新）
- [x] 5.3 設定ページ組み立て

### 6. ログイン画面 (`/login`)

- [x] 6.1 ログインUI（AppShell でNavBar条件付き非表示）

### 7. 空・ローディング・エラー状態

- [x] 7.1 スケルトンUI（TableSkeleton・shimmerアニメーション）
- [x] 7.2 空状態（「データなし」表示）
- [x] 7.3 エラー状態（インライン表示＋再試行ボタン）

### 8. コピー機能

- [x] 8.1 export.ts（buildLogText・buildRetroText）
- [x] 8.2 WeekGroupへの組み込み

### 9. レスポンシブ対応

- [x] 9.1 モバイルレイアウト調整（テーブル横スクロール・ExpandableCellモバイル幅）

---

## フェーズ2: Supabase セットアップ

- [x] S.1 Supabaseプロジェクト作成
- [x] S.2 スキーマ実行（`supabase/schema.sql`）
  - テーブル作成（log_entries・retro_entries・user_options）
  - RLS設定・updated_atトリガー・初期オプションシードトリガー
- [x] S.3 フロントエンド `.env.local` に URL・anon key を設定
- [x] S.4 Authでユーザー作成（ダッシュボード > Authentication > Users）
  - Secret API Key を `backend/.env` に設定済み

---

## フェーズ3: バックエンド実装

- [x] B.1 プロジェクト初期化
  - `backend/` ディレクトリ、`npm init`、TypeScript・Express 5・tsx 設定
  - 依存: –
- [x] B.2 共通基盤
  - `src/index.ts`（Express・CORS設定）、Supabaseクライアント初期化
  - 依存: B.1
- [x] B.3 認証ミドルウェア
  - `src/middleware/auth.ts`（JWT検証・user_id取得）
  - 依存: B.2
- [x] B.4 バリデーションミドルウェア
  - `src/middleware/validate.ts`（リクエストボディ検証）
  - 依存: B.2
- [x] B.5 行動記録 API
  - `src/routes/log.ts`（GET・POST・PATCH・DELETE）
  - 依存: B.3、B.4
- [x] B.6 振り返り API
  - `src/routes/retro.ts`（GET・POST・PATCH・DELETE）
  - 依存: B.3、B.4
- [x] B.7 設定 API
  - `src/routes/settings.ts`（GET・POST・DELETE）
  - 依存: B.3、B.4

---

## フェーズ4: フロントエンド・バックエンド統合

- [x] C.1 バックエンド起動確認（`npm run dev` @ localhost:8080）
- [x] C.2 `NEXT_PUBLIC_USE_MOCK=false` に切り替え
- [x] C.3 フロントエンドから実APIへの疎通確認
  - ログイン・GET・POST すべて動作確認済み

---

## 実装順序

```text
フェーズ1（完了）
    ↓
フェーズ2: S.1〜S.3（完了）→ S.4（バックエンド実装と並行）
    ↓
フェーズ3: B.1 → B.2 → B.3 → B.4 → B.5 → B.6 → B.7
    ↓
フェーズ4: C.1 → C.2 → C.3
```
