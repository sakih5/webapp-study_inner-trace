# Inner Trace — 設計書 v1.1

> 行動・感情記録 & 振り返りWebアプリケーション
> 作成日: 2026-02-22 / 更新日: 2026-02-22

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [システムアーキテクチャ](#2-システムアーキテクチャ)
3. [データベース設計](#3-データベース設計)
4. [API設計](#4-api設計)
5. [画面設計](#5-画面設計)
   - [5.1 デザインシステム](#51-デザインシステム)
   - [5.2 共通レイアウト](#52-共通レイアウト)
   - [5.3 行動・感情記録画面](#53-行動感情記録画面-log)
   - [5.4 振り返り画面](#54-振り返り画面-retro)
   - [5.5 設定画面](#55-設定画面-settings)
   - [5.6 空・ローディング・エラー状態](#56-空ローディングエラー状態)
6. [コンポーネント設計](#6-コンポーネント設計)
7. [状態管理設計](#7-状態管理設計)
8. [コピー仕様](#8-コピー仕様)
9. [認証設計](#9-認証設計)
10. [レスポンシブ設計](#10-レスポンシブ設計)
11. [デプロイ・インフラ設計](#11-デプロイインフラ設計)
12. [開発ロードマップ](#12-開発ロードマップ)
13. [今後の拡張候補](#13-今後の拡張候補)

---

## 1. プロジェクト概要

### 1.1 コンセプト

「Inner Trace」は仕事・生活の中で自分を見失わないための、毎日の記録と振り返りツールです。
まず記録する習慣をつけやすい、シンプルかつ素早い入力UXを最優先とし、
週次サマリーをAI等の外部ツールにコピー・エクスポートしやすい設計にします。

### 1.2 主要機能

| 機能 | 説明 |
|------|------|
| 行動・感情記録 | 日付・開始時間・終了時間・行動・感情を1行ずつ記録。過去日入力対応 |
| 振り返り記録 | KPT（Keep/Problem/Try）+ 学びをカテゴリ付きで記録 |
| 週グルーピング表示 | 週ごとにグループ化し折りたたみ/展開可能。最新週がデフォルト展開 |
| クリップボードコピー | 週単位のデータをテキスト形式でコピー（§8参照） |
| 設定管理 | 感情・振り返りタイプ・カテゴリのオプションを自由に追加・削除 |
| データ永続化 | Supabase PostgreSQLに保存 |

---

## 2. システムアーキテクチャ

### 2.1 技術スタック

| レイヤー | 技術 | バージョン | 役割 |
|----------|------|-----------|------|
| フロントエンド | Next.js (App Router) | 14.x | UIレンダリング・ルーティング |
| フロントエンド | TypeScript | 5.x | 型安全なコード記述 |
| フロントエンド | Tailwind CSS | 3.x | スタイリング |
| フロントエンド | SWR | 2.x | データフェッチ・キャッシュ・無限スクロール |
| バックエンド | Node.js + Express | 20.x / 5.x | REST APIサーバー |
| バックエンド | TypeScript | 5.x | 型安全なAPI実装 |
| DB | Supabase (PostgreSQL) | 15.x | データ永続化・認証 |
| デプロイ FE | Vercel | – | Next.jsホスティング |
| デプロイ BE | Google Cloud Run | – | コンテナベースAPIホスティング |

### 2.2 構成図

```
[ ブラウザ / Next.js on Vercel ]
        ↓ HTTPS REST (Authorization: Bearer JWT)
[ API Server (Express + TypeScript) on Cloud Run ]
        ↓ Supabase Client (service role key)
[ Supabase PostgreSQL ]
```

> フロントエンドから直接Supabaseを呼ばず、バックエンドAPI経由に統一することで、
> バリデーション・認可ロジックをバックエンドに集約します。

### 2.3 ディレクトリ構成

#### フロントエンド (Next.js)

```
src/
  app/
    layout.tsx              # 共通レイアウト（ナビゲーション含む）
    page.tsx                # トップ（/log へリダイレクト）
    login/
      page.tsx              # ログイン画面
    log/
      page.tsx              # 行動・感情記録画面
    retro/
      page.tsx              # 振り返り画面
    settings/
      page.tsx              # 設定画面（感情・振り返りタイプ管理）
  components/
    log/
      LogRow.tsx            # 1行分の行動記録
      AddLogButton.tsx      # 記録追加ボタン
    retro/
      RetroRow.tsx          # 1行分の振り返り記録
      AddRetroButton.tsx    # 振り返り追加ボタン
    shared/
      NavBar.tsx            # 上部ナビゲーションバー
      CopyButton.tsx        # コピー完了フィードバック付きボタン
      WeekGroup.tsx         # 週グループ（log・retro共通、折りたたみ対応）
      ExpandableCell.tsx    # クリック展開テキストエリア（ActionCell・ContentCell共通）
    settings/
      OptionList.tsx        # オプション一覧（追加・削除）共通コンポーネント
  lib/
    api.ts                  # APIクライアント（fetch wrapper）
    export.ts               # テキストコピーユーティリティ
    types.ts                # 共有型定義
    dateUtils.ts            # 日付操作ユーティリティ
    supabase.ts             # Supabaseクライアント（@supabase/ssr）
  hooks/
    useLog.ts               # 行動記録カスタムフック（SWR）
    useRetro.ts             # 振り返りカスタムフック（SWR）
    useSettings.ts          # 感情・振り返りタイプ・カテゴリオプション取得フック（SWR）
  proxy.ts                  # ルートガード（未認証時 /login へリダイレクト）※Next.js 16はmiddleware.tsではなくproxy.ts
```

#### バックエンド (Express + TypeScript)

```
src/
  routes/
    log.ts                  # 行動記録 CRUD
    retro.ts                # 振り返り CRUD
    settings.ts             # 感情・振り返りタイプオプション CRUD
  middleware/
    auth.ts                 # JWTバリデーションミドルウェア
    validate.ts             # リクエストバリデーション
  db/
    supabase.ts             # Supabaseクライアント初期化（service role key）
  types/
    index.ts                # 型定義
  index.ts                  # エントリポイント（CORS設定含む）
Dockerfile
```

---

## 3. データベース設計

### 3.1 テーブル: log_entries（行動・感情記録）

```sql
CREATE TABLE log_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL,
  start_time  text        NULL,  -- HH:MM 形式 (05:00〜29:50)。time型は24時超を扱えないため text で保持
  end_time    text        NULL,  -- HH:MM 形式 (05:00〜29:50)
  action      text        NOT NULL,
  emotion     text        NULL,  -- 選択肢は user_options テーブルで管理（CHECK制約なし）。未選択時はNULL
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_log_user_date ON log_entries (user_id, date DESC);
```

### 3.2 テーブル: retro_entries（振り返り）

```sql
CREATE TABLE retro_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL,
  type        text        NOT NULL,  -- 選択肢は user_options テーブルで管理（CHECK制約なし）
  category    text        NOT NULL,  -- 選択肢は user_options テーブルで管理（CHECK制約なし）
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_retro_user_date ON retro_entries (user_id, date DESC);
```

### 3.3 共通設定

```sql
-- updated_at 自動更新トリガー（log_entries・retro_entries に適用）
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_updated_at
  BEFORE UPDATE ON log_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_retro_updated_at
  BEFORE UPDATE ON retro_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE log_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE retro_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows only" ON log_entries
  USING (user_id = auth.uid());
CREATE POLICY "own rows only" ON retro_entries
  USING (user_id = auth.uid());
```

### 3.4 テーブル: user_options（感情・タイプ・カテゴリ共通オプション）

感情・振り返りタイプ・振り返りカテゴリの3種類のオプションを1テーブルで管理する。
`option_type` カラムで種別を区別し、テーブル定義の重複を排除する。

```sql
CREATE TABLE user_options (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_type text        NOT NULL CHECK (option_type IN ('emotion', 'retro_type', 'retro_category')),
  label       text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_options_user_type ON user_options (user_id, option_type, sort_order);

ALTER TABLE user_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rows only" ON user_options USING (user_id = auth.uid());
```

**初期データ（ユーザー登録時に Database Trigger でシード）:**

```sql
-- auth.users への INSERT 時に初期オプションをシードする
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_options (user_id, option_type, label, sort_order) VALUES
    (NEW.id, 'emotion',        '集中',      0),
    (NEW.id, 'emotion',        '普通',      1),
    (NEW.id, 'emotion',        '疲れ',      2),
    (NEW.id, 'emotion',        '不安',      3),
    (NEW.id, 'emotion',        '嬉しい',    4),
    (NEW.id, 'emotion',        '達成感',    5),
    (NEW.id, 'emotion',        '焦り',      6),
    (NEW.id, 'emotion',        'つらい',    7),
    (NEW.id, 'emotion',        'やる気',    8),
    (NEW.id, 'emotion',        'リラックス', 9),
    (NEW.id, 'retro_type',     'Keep',      0),
    (NEW.id, 'retro_type',     'Problem',   1),
    (NEW.id, 'retro_type',     'Try',       2),
    (NEW.id, 'retro_type',     '学び',      3),
    (NEW.id, 'retro_category', '仕事',      0),
    (NEW.id, 'retro_category', '勉強',      1),
    (NEW.id, 'retro_category', '生活',      2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**`sort_order` の採番ルール:**

- 新規オプション追加時: `SELECT COALESCE(MAX(sort_order), -1) + 1 FROM user_options WHERE user_id = $1 AND option_type = $2` で末尾に採番する
- 並び替えUIは現バージョンでは提供しない（将来拡張候補: §13参照）

> 既存レコードの `emotion` / `type` / `category` 値は `user_options` を外部キーで参照しない。
> オプションを削除しても既存レコードはそのまま保持される（孤立値の扱いは §5.3 / §5.4 参照）。

---

## 4. API設計

### 4.1 共通仕様

- Base URL: `https://api.inner-trace.app/v1`
- 認証: `Authorization: Bearer <supabase_jwt>`
- Content-Type: `application/json`
- エラー形式: `{ "error": { "code": "string", "message": "string" } }`

**エラーコード一覧:**

| code | HTTP ステータス | 説明 |
|------|----------------|------|
| `VALIDATION_ERROR` | 400 | リクエストボディのバリデーション違反 |
| `UNAUTHORIZED`     | 401 | JWTが無効・期限切れ |
| `FORBIDDEN`        | 403 | 他ユーザーのリソースへのアクセス |
| `NOT_FOUND`        | 404 | 指定IDのリソースが存在しない |
| `INTERNAL_ERROR`   | 500 | サーバー内部エラー |

### 4.2 行動・感情記録 API

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/log?from=YYYY-MM-DD&to=YYYY-MM-DD` | 指定期間の記録一覧取得 |
| POST | `/log` | 記録1件作成 |
| PATCH | `/log/:id` | 記録1件更新 |
| DELETE | `/log/:id` | 記録1件削除 |

**POST /log リクエスト例**

```json
{
  "date": "2026-02-22",
  "start_time": "09:00",
  "end_time": "10:30",
  "action": "PoC設計書レビュー",
  "emotion": "集中"
}
```

**GET /log レスポンス例**

```json
[
  {
    "id": "uuid",
    "date": "2026-02-22",
    "start_time": "09:00",
    "end_time": "10:30",
    "action": "PoC設計書レビュー",
    "emotion": "集中",
    "created_at": "2026-02-22T09:00:00Z",
    "updated_at": "2026-02-22T09:00:00Z"
  }
]
```

### 4.3 振り返り API

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/retro?from=YYYY-MM-DD&to=YYYY-MM-DD` | 指定期間の振り返り一覧取得 |
| POST | `/retro` | 振り返り1件作成 |
| PATCH | `/retro/:id` | 振り返り1件更新 |
| DELETE | `/retro/:id` | 振り返り1件削除 |

**POST /retro リクエスト例**

```json
{
  "date": "2026-02-22",
  "type": "Keep",
  "category": "仕事",
  "content": "朝のタスク整理が効果的だった"
}
```

### 4.4 設定 API

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/settings/options?type=emotion` | 感情オプション一覧取得（sort_order順） |
| GET | `/settings/options?type=retro_type` | 振り返りタイプオプション一覧取得 |
| GET | `/settings/options?type=retro_category` | 振り返りカテゴリオプション一覧取得 |
| POST | `/settings/options` | オプション1件追加（body: `{ option_type, label }`） |
| DELETE | `/settings/options/:id` | オプション1件削除 |

> 削除時に既存レコードへの影響チェックは行わない。既存レコードの値はそのまま保持される。

### 4.5 バリデーション仕様

フロントエンド・バックエンド両方で同じルールを適用する。

#### log_entries

| フィールド | 必須 | 型・制約 | 備考 |
|-----------|------|---------|------|
| date | 必須 | `date` (YYYY-MM-DD) | – |
| action | 必須 | `string`, 最大5000文字 | 空文字・空白のみは無効 |
| start_time | 任意 | `HH:MM` (05:00〜29:50、10分刻み) or null | 未選択はnull |
| end_time | 任意 | `HH:MM` (05:00〜29:50、10分刻み) or null | 未選択はnull |
| emotion | 任意 | `user_options` のラベル文字列 or null | 未選択時はNULLを保存。削除済みオプション（孤立値）も保存・更新を許容する |

#### retro_entries

| フィールド | 必須 | 型・制約 | 備考 |
|-----------|------|---------|------|
| date | 必須 | `date` (YYYY-MM-DD) | – |
| type | 必須 | `user_options` の `retro_type` リストのいずれか | デフォルト値をリスト先頭（Keep）にする |
| category | 必須 | `user_options` の `retro_category` リストのいずれか | デフォルト値をリスト先頭（仕事）にする |
| content | 必須 | `string`, 最大5000文字 | 空文字・空白のみは無効 |

> **最大文字数5000字の設定意図:**
> UX上の制限というより、異常に大きなペイロードを防ぐセキュリティ用途。
> 通常の利用ではまず到達しない値に設定している。

#### フロントエンドでの扱い

- 新規行（仮行）の破棄判定は `action` / `content` が空かどうかで行う（§5.3参照）
- 既存行で `action` / `content` を空にしてblurした場合は保存せず元の値に戻す（バリデーションエラー表示はしない）
- 5000字超過時はそれ以上入力できないよう `maxLength` 属性で制御する

#### バックエンドでの扱い

`src/middleware/validate.ts` にてリクエストボディを検証し、違反時は `400 Bad Request` を返す。

```typescript
// エラーレスポンス例
{ "error": { "code": "VALIDATION_ERROR", "message": "action is required" } }
```

---

## 5. 画面設計

### 5.1 デザインシステム

#### カラーパレット

| 変数名 | 値 | 用途 |
|--------|-----|------|
| `--bg` | `#FFFFFF` | ページ背景（白） |
| `--paper` | `#F4F4F4` | カード・テーブル背景 |
| `--ink` | `#0D0D0D` | メインテキスト・ボタン背景 |
| `--ink-light` | `#8E8EA0` | サブテキスト・ラベル |
| `--accent` | `#10A37F` | アクセント（展開中ボーダー・ロゴ） |
| `--border` | `#E5E5E5` | テーブルボーダー・区切り線 |
| `--keep` | `#10A37F` | 保存完了ステータス表示（`--accent` と同値） |
| `--problem` | `#EF4146` | エラー・警告表示 |

#### タイポグラフィ

| 用途 | フォント | サイズ | ウェイト |
|------|---------|--------|---------|
| ロゴ | Inter | 20px | 800 |
| 週ラベル・日付ラベル | Inter | 13px | 600 |
| ページタイトル | Inter | 16px | 600 |
| テーブルヘッダー | Source Code Pro | 9px | 500（大文字） |
| セル入力・テキスト | Source Code Pro | 12px | 400 |
| ボタン・ラベル | Source Code Pro | 10–11px | 400 |

> 日本語文字には Noto Sans JP をフォールバックとして使用する。

#### 背景テクスチャ

なし。ページ背景は白一色（`--bg: #FFFFFF`）とする。

---

### 5.2 共通レイアウト

#### ナビゲーションバー（固定、高さ54px）

```
|  Inner Trace  |  [ 行動・感情記録 | 振り返り ]  |  2026.02.22  ⚙ |
```

- 左端: ロゴ「Inner Trace」（々を--accent色で表示）
- 中央: タブ切り替えUI
  - 2つのボタンを `background: --bg` のピル型コンテナに格納
  - アクティブなタブは `background: --paper` + `box-shadow` で浮き上がり
- 右端: 今日の日付（`YYYY.MM.DD` 形式）+ 歯車アイコン（⚙）で `/settings` へ遷移
  - モバイル時は日付を非表示にして歯車アイコンのみ表示

#### 保存ステータス表示（右下固定、小さく表示）

手動保存ボタンは設けない。編集内容は自動保存され、右下に小さくステータスを表示する。

| 状態 | 表示テキスト | スタイル |
|------|------------|---------|
| 保存中 | `保存中...` | `color: --ink-light` |
| 保存完了 | `✓ 保存済み`（3秒後に消える） | `color: --keep` |
| 保存失敗 | `! 保存できませんでした` | `color: --problem` |

- `position: fixed`, `bottom: 16px`, `right: 20px`
- `font-family: Source Code Pro`, `font-size: 11px`
- 保存失敗時はクリックでリトライ

**楽観的更新失敗時のロールバック:**

- API呼び出し失敗 → `mutate()` で再フェッチしてUIを元の状態に戻す
- 同時に右下ステータスを「! 保存できませんでした」に更新
- クリックでリトライ（同じ PATCH を再実行）

#### タイムゾーン方針

- **ブラウザのローカル時間**を使用する。サーバーサイドでのタイムゾーン変換は行わない。
- `date` フィールド（YYYY-MM-DD）はブラウザの `new Date()` から取得し、UTC変換なしにそのまま送信する。
- 深夜をまたぐ利用（日付変更線の扱い）も、ユーザーのブラウザが認識している日付をそのまま記録として採用する。

---

### 5.3 行動・感情記録画面 (`/log`)

#### 全体レイアウト

```
[ナビゲーションバー]
─────────────────────────────
行動・感情記録         [ ＋ 記録を追加 ]
↑ 新しい日付が上 · 同日内は開始時間の新しい順

[WeekGroup: 2026/02/16 〜 2026/02/22]  ← 最新週（デフォルト展開）
  [DateGroup: 2026/02/22 (日) — 今日]
    [テーブル: LogRow × N]
  [DateGroup: 2026/02/21 (土)]
    [テーブル: LogRow × N]

[WeekGroup: 2026/02/09 〜 2026/02/15]  ← デフォルト折りたたみ
  ...
```

#### 「＋ 記録を追加」ボタン動作

1. クリックするとローカルに仮行を追加（IDなし、`crypto.randomUUID()` の仮IDを付与）
2. 日付はデフォルト「今日」だが変更可能（`<input type="date">`）
3. 仮行は該当日付グループの先頭に追加される
4. 行追加後、その行の「行動」セルに自動フォーカス

**初回保存のタイミング（新規行）:**

新規行は `action` フィールドが必須のため、`action` に意味のある入力がされた時点で初めてPOSTする。

| ケース | 動作 |
|--------|------|
| `action` に入力してblur | POST → 本物のIDで仮IDを置き換え → 以降はPATCHで自動保存 |
| `action` に入力してdebounce完了（800ms） | POST（blurより先に800ms経過した場合も同様） |
| time / emotion の select のみ変更してblur | `action` が空のためPOSTしない。選択値はローカルステートのみに保持し、`action` 入力時のPOSTに含める |
| 何も入力せずblur（`action` が空） | 仮行を破棄（APIコールなし） |

> **設計意図:**
> `action` が空のままDBにレコードを作らないことで、誤クリック・中途半端な操作による空レコードの蓄積を防ぐ。
> `action` が入力されれば、その時点でのtime/emotionの選択値も一緒にPOSTされる。

#### WeekGroup（週グループ）

**ヘッダーの構成:**

```
[ ▼ 📅 2026/02/16 〜 2026/02/22 ]        [ コピー ]
```

- クリックで折りたたみ/展開トグル
- アイコン: 展開時 `▼`、折りたたみ時 `▶`
- 週の範囲は月曜日〜日曜日（ISO週）
- ヘッダーボーダー: `border-bottom: 2px solid --ink`
- 右端ボタン群:
  - **「コピー」ボタン**: その週のデータをテキスト形式でクリップボードコピー。クリック後2.5秒間「✓ コピー済」に変化。コピーフォーマットの詳細は §8 参照

**展開/折りたたみアニメーション:**

- コンテンツ部分を `max-height` + `overflow: hidden` でアニメーション
- 展開: `max-height: 0 → 2000px` (transition: 0.3s ease)
- 折りたたみ: 逆方向

**デフォルト展開状態の決定ロジック:**

```typescript
// データの中で最新の週キーを持つグループのみ展開
const latestWeekKey = weekKeys[0]; // sort降順なので先頭が最新
defaultOpen = (weekKey === latestWeekKey);
```

#### DateGroup（日付グループ）

各日付のラベルと、その日のエントリが入ったテーブルをまとめるコンテナ。

**日付ラベルの表示形式:**

```
2026/02/22 (日) — 今日
2026/02/21 (土) — 昨日
2026/02/20 (金)
```

ラベルは `font-family: Inter`, `font-size: 13px`, `color: --ink-light`
下線: `border-bottom: 1.5px solid --border`

#### LogRow テーブル

**カラム定義:**

| カラム名 | 幅 | 要素 | 備考 |
|---------|-----|------|------|
| 日付 | 100px | `<input type="date">` | 変更すると別の日付グループに移動（後述） |
| 開始時間 | 90px | `<select>` | 10分刻みセレクト。変更時に同日内でリアルタイムソート |
| 終了時間 | 90px | `<select>` | 10分刻みセレクト |
| 行動 | 残り全幅 | ExpandableCell（展開型テキストエリア） | 後述 |
| 感情 | 110px | `<select>` | 選択肢は下記参照 |
| （削除） | 40px | `×` ボタン | hover時のみ赤く変色 |

**日付変更時の行移動:**

1. ユーザーが日付 `<input>` を変更 → `onChange` が即時発火
2. 楽観的更新: ローカルステートを即時更新し、新しい日付グループへ行をフェードアウト → フェードインで移動
3. PATCH APIを非同期で実行
4. API失敗時: 元の日付に戻す（ロールバック）+ 右下にエラー表示

**時間選択肢（開始時間・終了時間共通）:**

- 範囲: `05:00` 〜 `29:50` を10分刻み、計300択
- 先頭に空オプション `—`（未選択、null保存）
- `24:00` 以上の値は表示上 `翌HH:MM` とラベル表示し、保存値は `HH:MM` のまま（例: 表示 `翌01:30` → 保存 `25:30`）

```typescript
// 選択肢生成
function generateTimeOptions(): { value: string; label: string }[] {
  const options = [{ value: '', label: '—' }];
  for (let h = 5; h < 30; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 29 && m > 50) break;
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const label = h >= 24
        ? `翌${String(h - 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        : value;
      options.push({ value, label });
    }
  }
  return options;
}
```

**感情選択肢:**

`user_options` テーブルから `option_type = 'emotion'` の行を `sort_order` 順に動的取得する。

```
—（未選択）/ 集中 / 普通 / 疲れ / 不安 / 嬉しい / 達成感 / 焦り / つらい / やる気 / リラックス
```

**孤立値（削除済みオプション）の表示ルール:**

レコードが保持している感情値が `user_options` に存在しない場合（設定画面で削除されたなど）、その選択肢をドロップダウンの先頭にグレー表示で追加し、選択解除できるようにする。

```html
<!-- 孤立値の場合（グレーで表示するがselectできる状態を維持） -->
<option value="古い感情" style="color: gray">古い感情（削除済み）</option>
```

- `disabled` は付けない（現在の値として表示できる状態を維持する必要があるため）
- 孤立値は通常の選択肢リストの先頭に追加する
- 別の選択肢に変更すれば孤立値の option は消える

**テーブルスタイル:**

- `border-radius: 8px` + `overflow: hidden` をラッパーdivで適用（テーブル自体はoverflowはvisibleを維持してExpandableCellの展開を妨げない）
- ヘッダー行: `background: #F0EBE0`
- 奇数行: `--paper`、偶数行: `--bg`
- hover: `background: rgba(245,240,232,0.5)`

#### ActionCell（行動セルの展開動作）

通常状態: テキストをプレビュー表示（overflow: hidden, text-overflow: ellipsis）
展開状態: `position: fixed` のポップアップテキストエリアを表示

**展開ロジック（詳細）:**

1. セルをクリック → `open` クラスを付与
2. `getBoundingClientRect()` でセルの画面上の座標を取得
3. 展開エリアを `position: fixed` で配置（位置計算の詳細は §6.5 参照）
4. textarea にフォーカス、カーソルをテキスト末尾に移動
5. 他のセルが展開中の場合は先にそちらを閉じる

**展開エリアのスタイル:**

```
┌─────────────────────────────────────────┐  ← border: 1.5px solid --accent
│                                         │
│  [textarea: min-height 80px, resizable] │
│                                         │
├─────────────────────────────────────────┤
│ フォーカスを外すと閉じます               │  ← font-size: 9px, color: --ink-light
└─────────────────────────────────────────┘
```

**閉じる条件:**

- textarea から blur（`onBlur`）→ 120ms 遅延後に閉じる（ボタンクリック等のイベントを妨げないため）
- 展開エリア外をクリック（`document.addEventListener('click')`）

---

### 5.4 振り返り画面 (`/retro`)

行動記録画面とほぼ同じ構造だが、テーブルのカラムが異なる。

#### 全体レイアウト

```
[ナビゲーションバー]
─────────────────────────────
振り返り               [ ＋ 振り返りを追加 ]
↑ 新しい日付が上

[WeekGroup: 2026/02/16 〜 2026/02/22]  ← 最新週（デフォルト展開）
  [DateGroup: 2026/02/22 (日) — 今日]
    [テーブル: RetroRow × N]
  ...

[WeekGroup: ...] ← デフォルト折りたたみ
```

#### 「＋ 振り返りを追加」ボタン動作

§5.3 と同様の仮行方式。`content` フィールドが必須のため、`content` に最初の入力がされた時点でPOSTする。

| ケース | 動作 |
|--------|------|
| `content` に入力してblur | POST → 本物のIDで仮IDを置き換え → 以降はPATCHで自動保存 |
| `content` に入力してdebounce完了（800ms） | POST（blurより先に800ms経過した場合も同様） |
| type / category / date の変更のみ | `content` が空のためPOSTしない。選択値はローカルステートのみに保持 |
| 何も入力せずblur（`content` が空） | 仮行を破棄（APIコールなし） |

#### RetroRow テーブル

**カラム定義:**

| カラム名 | 幅 | 要素 | 備考 |
|---------|-----|------|------|
| 日付 | 100px | `<input type="date">` | デフォルト今日、変更可 |
| タイプ | 110px | `<select>` | Keep / Problem / Try / 学び |
| カテゴリ | 90px | `<select>` | 仕事 / 勉強 / 生活 |
| 振り返り内容 | 残り全幅 | ExpandableCell（展開型テキストエリア） | 行動セルと同じ動作 |
| （削除） | 40px | `×` ボタン | – |

**タイプ・カテゴリ選択肢:**

それぞれ `user_options` テーブルの `option_type = 'retro_type'` / `option_type = 'retro_category'` から動的取得する。色分けは行わない。
孤立値（削除済みオプション）は §5.3 感情ドロップダウンと同じルールでグレー表示する。

---

### 5.5 設定画面 (`/settings`)

#### 全体レイアウト

```
[ナビゲーションバー]
─────────────────────────────
設定

── 感情オプション ──────────────────────
  集中
  普通
  疲れ          [ × ]
  不安          [ × ]
  …
  [ + 追加 ] [ テキスト入力 ]

── 振り返りタイプオプション ─────────────
  Keep
  Problem
  Try           [ × ]
  学び          [ × ]
  …
  [ + 追加 ] [ テキスト入力 ]

── 振り返りカテゴリオプション ───────────
  仕事
  勉強          [ × ]
  生活          [ × ]
  …
  [ + 追加 ] [ テキスト入力 ]
```

#### 動作仕様

- 各オプションの右端に `×` ボタン。クリックで確認ダイアログを表示し、OKでDELETE

  ```
  「"集中" を削除しますか？
   既存の記録に使われている場合でも削除されます。」
  [ キャンセル ]  [ 削除する ]
  ```
- 追加: テキスト入力欄に入力してEnterキーまたは「+ 追加」ボタンでPOST
- 空欄のまま追加しようとした場合は無視する
- 削除しても既存レコードの値はそのまま保持される（孤立した値も表示される）

---

### 5.6 空・ローディング・エラー状態

#### 空状態（データなし）

**週グループ丸ごとデータなし**: 週ヘッダーの直下に `データなし` をグレーテキストで表示

```
▼ 2026/02/16 〜 2026/02/22
  データなし
```

#### ローディング状態

**認証チェック中（初回アクセス時）**

ナビゲーションバーのみ表示し、コンテンツ領域全体をスケルトンで覆う。認証確認が完了次第コンテンツを表示する。

**初期ロード（データ取得中）**

テーブルの骨格をグレーバーで模したスケルトンを表示。

```
████████████████████████████████   ← 週ヘッダー風プレースホルダー
  ░░░░░░  ░░░░░░  ░░░░░░░░░░░░░  ░░░░░░
  ░░░░░░  ░░░░░░  ░░░░░░░░░░░░░  ░░░░░░
  ░░░░░░  ░░░░░░  ░░░░░░░░░░░░░  ░░░░░░
```

- プレースホルダー行は3〜4本
- shimmer アニメーション（左→右に光が流れる `background: linear-gradient`）
- 色: `--border` ベースの薄いグレー

**無限スクロール追加読み込み中**

ページ下端のセンチネル div にスピナーのみ表示。

#### エラー状態

**ロード失敗時**

コンテンツ領域にインライン表示し、再試行ボタンを置く。

```
データを取得できませんでした。
[ 再試行 ]
```

- テキスト: `color: --problem`, `font-family: Source Code Pro`, `font-size: 12px`
- 「再試行」ボタン: クリックで同じ SWR キーを `mutate()` して再フェッチ

**保存失敗時**

§5.2 の右下ステータスインジケーターで対応（`! 保存できませんでした` → クリックでリトライ）。

---

## 6. コンポーネント設計

### 6.1 共通型定義 (`src/lib/types.ts`)

```typescript
// 感情・振り返りタイプ・カテゴリはDBのマスタテーブルで動的管理するため string 型
export type Emotion = string;
export type RetroType = string;
export type RetroCategory = string;

// user_options テーブルの1行に対応（emotion / retro_type / retro_category 共通）
export interface UserOption {
  id: string;
  option_type: 'emotion' | 'retro_type' | 'retro_category';
  label: string;
  sort_order: number;
}

export interface LogEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  start_time: string | null;  // HH:MM (05:00〜29:50) or null
  end_time: string | null;    // HH:MM (05:00〜29:50) or null
  action: string;
  emotion: Emotion | null;    // null = 未選択
  created_at?: string;
  updated_at?: string;
}

export interface RetroEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  type: RetroType;
  category: RetroCategory;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface WeekRange {
  from: string;          // YYYY-MM-DD (月曜日)
  to: string;            // YYYY-MM-DD (日曜日)
  label: string;         // 表示用: "2026/02/16 〜 2026/02/22"
}
```

### 6.2 NavBar (`src/components/shared/NavBar.tsx`)

NavBar はルーティングを内部で管理する。`usePathname()` で現在のパスを取得してアクティブタブを判定するため、外部からのコールバックは不要。

```typescript
// NavBar は props なし。usePathname / useRouter を内部で使用する
export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = pathname.startsWith('/log')      ? 'log'
                  : pathname.startsWith('/retro')    ? 'retro'
                  : pathname.startsWith('/settings') ? 'settings'
                  : 'log';

  return (/* ... */);
}
```

- `position: fixed`, `z-index: 200`, `height: 54px`

### 6.3 WeekGroup (`src/components/shared/WeekGroup.tsx`)

log・retro 両画面で共用するため `shared` に置き、子コンテンツを `children` で受け取るラッパー型にする。

```typescript
interface WeekGroupProps {
  week: WeekRange;
  defaultOpen?: boolean;        // デフォルト展開（最新週のみtrue）
  onCopy: () => string;         // コピーボタン押下時に呼ぶテキスト生成関数
  children: React.ReactNode;    // DateGroup × N を渡す（log/retro で異なる）
}
```

**内部状態:**

```typescript
const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
```

**週キー生成ロジック:**

```typescript
// ISO週（月曜始まり）の月曜日を計算
function getWeekMonday(dateStr: string): Date {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=日
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday;
}

function getWeekRange(dateStr: string): WeekRange {
  const monday = getWeekMonday(dateStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  return {
    from: fmt(monday),
    to: fmt(sunday),
    label: `${fmt(monday).replace(/-/g,'/')} 〜 ${fmt(sunday).replace(/-/g,'/')}`
  };
}
```

### 6.4 LogRow (`src/components/log/LogRow.tsx`)

```typescript
interface LogRowProps {
  entry: LogEntry;
  onUpdate: (id: string, patch: Partial<LogEntry>) => void;
  onDelete: (id: string) => void;
}
```

**開始時間変更時の処理:**

- `onUpdate` を呼んで上位でソートし再レンダリング
- 楽観的更新: ローカルステートを即時更新しつつAPIを呼ぶ

### 6.5 ExpandableCell (`src/components/shared/ExpandableCell.tsx`)

ActionCell（行動）と ContentCell（振り返り内容）は全く同じ動作・スタイルのため、`ExpandableCell` として共通コンポーネント化する。

```typescript
interface ExpandableCellProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}
```

**状態:**

```typescript
const [isOpen, setIsOpen] = useState(false);
const [value, setValue] = useState(props.value || '');
const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
const cellRef = useRef<HTMLTableCellElement>(null);
const textareaRef = useRef<HTMLTextAreaElement>(null);
const isComposing = useRef(false); // IME変換中フラグ
```

**展開時のスタイル計算（デスクトップ・モバイル・仮想キーボード対応）:**

```typescript
const calcPopupStyle = useCallback((): CSSProperties => {
  if (!cellRef.current) return {};
  const rect = cellRef.current.getBoundingClientRect();

  // visualViewport API でモバイルの仮想キーボード表示時のずれを補正
  // window.innerHeight はキーボード表示時も変化しないが visualViewport.height は変化する
  const vv = window.visualViewport;
  const viewportHeight = vv?.height ?? window.innerHeight;
  const offsetTop = vv?.offsetTop ?? 0;

  const isMobile = window.innerWidth < 768;
  const popupWidth = isMobile ? window.innerWidth * 0.9 : 340;
  const popupHeight = 140; // 推定最小高さ

  // セル直下に表示。画面下端を超える場合はセル上部に表示
  let top = rect.bottom + 4 - offsetTop;
  if (top + popupHeight > viewportHeight) {
    top = Math.max(4, rect.top - popupHeight - 4 - offsetTop);
  }

  const left = isMobile
    ? window.innerWidth * 0.05
    : Math.min(rect.left, window.innerWidth - popupWidth - 12);

  return { position: 'fixed', top, left, width: popupWidth, zIndex: 500 };
}, []);

const handleOpen = () => {
  setPopupStyle(calcPopupStyle());
  setIsOpen(true);
  setTimeout(() => textareaRef.current?.focus(), 10);
};
```

**スクロール・仮想キーボード追従:**

```typescript
const updatePopupPosition = useCallback(() => {
  if (!isOpen) return;
  setPopupStyle(calcPopupStyle());
}, [isOpen, calcPopupStyle]);

useEffect(() => {
  if (!isOpen) return;
  window.addEventListener('scroll', updatePopupPosition, { passive: true });
  window.visualViewport?.addEventListener('resize', updatePopupPosition);
  window.visualViewport?.addEventListener('scroll', updatePopupPosition);
  return () => {
    window.removeEventListener('scroll', updatePopupPosition);
    window.visualViewport?.removeEventListener('resize', updatePopupPosition);
    window.visualViewport?.removeEventListener('scroll', updatePopupPosition);
  };
}, [isOpen, updatePopupPosition]);
```

**自動保存ロジック（IME対応）:**

日本語入力（IME）の変換途中に保存が走ると未確定文字が保存されてしまうため、
`compositionstart` / `compositionend` イベントで変換中かどうかを管理する。

```typescript
const debouncedSave = useMemo(
  () => debounce((value: string) => onChange(value), 800),
  [onChange]
);

const handleCompositionStart = () => { isComposing.current = true; };

const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
  isComposing.current = false;
  debouncedSave(e.currentTarget.value); // 変換確定後にタイマー開始
};

const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setValue(e.target.value);
  if (!isComposing.current) {
    debouncedSave(e.target.value); // 英数字入力はそのままタイマー開始
  }
};

const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
  debouncedSave.cancel();
  onChange(e.target.value); // フォーカス離脱時は即時保存
  // 120ms 遅延後に展開を閉じる（他ボタンのクリックイベントを妨げないため）
  setTimeout(() => setIsOpen(false), 120);
};
```

**保存タイミングまとめ:**

| トリガー | 保存タイミング | 備考 |
|---------|-------------|------|
| 文字入力中（英数字） | 入力停止から800ms後 | debounce |
| 日本語変換確定（Enter） | 確定後800ms後 | compositionend + debounce |
| フォーカス離脱（blur） | 即時 | debounce キャンセル後に実行 |
| IME変換途中 | 保存しない | isComposing フラグで制御 |

`time` / `date` インプットと `select` も、`onChange` 時に即時 `onUpdate` を呼ぶ（短い文字列のため debounce 不要）。

### 6.6 CopyButton (`src/components/shared/CopyButton.tsx`)

```typescript
interface CopyButtonProps {
  getText: () => string;  // コピーするテキストを返す関数
  label?: string;         // デフォルト: "コピー"
}
```

**動作:**

```typescript
const [copied, setCopied] = useState(false);
const handleClick = async () => {
  await navigator.clipboard.writeText(getText());
  setCopied(true);
  setTimeout(() => setCopied(false), 2500);
};
// copied時: label="✓ コピー済", border-color=--keep, color=--keep
```

### 6.7 useSettings (`src/hooks/useSettings.ts`)

感情・振り返りタイプ・振り返りカテゴリのオプション取得・追加・削除を担うフック。3種類それぞれで独立したSWRキャッシュを持つ。

```typescript
export function useSettings(optionType: 'emotion' | 'retro_type' | 'retro_category') {
  const { data, error, mutate } = useSWR<UserOption[]>(
    `/settings/options?type=${optionType}`,
    fetcher
  );

  const options = data ?? [];
  const isLoading = !data && !error;

  const add = async (label: string) => {
    // 楽観的更新: 末尾に仮エントリを追加
    const tempId = crypto.randomUUID();
    mutate(
      [...options, { id: tempId, option_type: optionType, label, sort_order: options.length }],
      false
    );
    const newOption = await api.post<UserOption>('/settings/options', { option_type: optionType, label });
    mutate(); // 再フェッチで仮エントリを本物のIDに置き換え
    return newOption;
  };

  const remove = async (id: string) => {
    mutate(options.filter(o => o.id !== id), false);
    await api.delete(`/settings/options/${id}`);
    mutate();
  };

  return { options, isLoading, error, add, remove };
}
```

---

## 7. 状態管理設計

### 7.0 保存方針

- **自動保存**のみ。手動保存ボタンは設けない。
- テキスト系セル（行動・振り返り内容）は **IME対応debounce**（§6.5参照）で保存。
- 選択系セル（感情・タイプ・カテゴリ・日付・時間）は `onChange` 時に**即時**保存。
- 保存中/完了/失敗のステータスは右下の小さなインジケーターで通知（§5.2参照）。

### 7.1 データ読み込み範囲・無限スクロール

#### 初期表示

- 今日を含む週（最新週）+ その前の週の、計**2週分**を初期ロードする。
- 最新週は展開、前の週は折りたたみ状態がデフォルト。

#### 無限スクロール（過去データ追加読み込み）

- ページ下端に近づいたら（`IntersectionObserver`）、さらに2週前のデータを追加フェッチする。
- ローディング中はスピナーを下端に表示。それ以上データがない場合はスピナーを消す。

### 7.2 データ取得・キャッシュ（useSWRInfinite）

複数期間のデータを「積み上げて」管理するため、SWR の **`useSWRInfinite`** を使用する。

```typescript
// src/hooks/useLog.ts

// ページインデックスから取得期間を算出するヘルパー
function getPageRange(pageIndex: number): { from: string; to: string } {
  // pageIndex=0: 最新2週、pageIndex=1: さらに前の2週、...
  const todayWeek = getWeekRange(today());
  const to = new Date(todayWeek.to);
  to.setDate(to.getDate() - pageIndex * 14);
  const from = new Date(to);
  from.setDate(from.getDate() - 13);
  return { from: fmt(from), to: fmt(to) };
}

export function useLog() {
  const { data, error, size, setSize, mutate } = useSWRInfinite<LogEntry[]>(
    (pageIndex) => {
      const { from, to } = getPageRange(pageIndex);
      return `/log?from=${from}&to=${to}`;
    },
    fetcher
  );

  const entries: LogEntry[] = data ? data.flat() : [];
  const isLoading = !data && !error;
  const isLoadingMore = size > 1 && data && data[size - 1] === undefined;
  const hasMore = !data || data[data.length - 1]?.length > 0;

  const loadMore = () => setSize(size + 1);

  const add = async (entry: Omit<LogEntry, 'id'>) => {
    const newEntry = await api.post<LogEntry>('/log', entry);
    mutate(); // 全ページ再検証
    return newEntry;
  };

  const update = async (id: string, patch: Partial<LogEntry>) => {
    // 楽観的更新: 全ページにわたって対象エントリを更新
    mutate(
      data?.map(page => page.map(e => e.id === id ? { ...e, ...patch } : e)),
      false
    );
    try {
      await api.patch(`/log/${id}`, patch);
    } catch (err) {
      mutate();               // ロールバック（再フェッチ）
      setSaveStatus('error'); // 右下ステータスをエラー表示（§5.2参照）
      throw err;
    }
    mutate();
  };

  const remove = async (id: string) => {
    mutate(
      data?.map(page => page.filter(e => e.id !== id)),
      false
    );
    await api.delete(`/log/${id}`);
    mutate();
  };

  return { entries, isLoading, isLoadingMore, hasMore, loadMore, add, update, remove };
}
```

> `setSaveStatus` は右下インジケーターのステートセッター。SaveStatusContext 等のコンテキスト経由で参照する。

**IntersectionObserver によるスクロール末端検知:**

```typescript
const sentinelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !isLoadingMore && hasMore) {
      loadMore();
    }
  }, { rootMargin: '200px' });
  if (sentinelRef.current) observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [isLoadingMore, hasMore]);

// JSX の末尾に配置
<div ref={sentinelRef} />
```

### 7.3 ソートロジック

```typescript
// 行動記録: 日付降順 → 同日内は開始時間降順（新しい時間が上）
// 開始時間 NULL のエントリは最後尾（'99:99' として扱う）
function sortLogEntries(entries: LogEntry[]): LogEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    const at = a.start_time || '99:99'; // null/空 → 最後尾扱い
    const bt = b.start_time || '99:99';
    return bt.localeCompare(at);
  });
}

// 振り返り: 日付降順のみ
function sortRetroEntries(entries: RetroEntry[]): RetroEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}
```

### 7.4 週グルーピングロジック

```typescript
function groupByWeek<T extends { date: string }>(
  entries: T[]
): Map<string, { week: WeekRange; entries: T[] }> {
  const map = new Map<string, { week: WeekRange; entries: T[] }>();
  for (const entry of entries) {
    const week = getWeekRange(entry.date);
    const key = week.from;
    if (!map.has(key)) map.set(key, { week, entries: [] });
    map.get(key)!.entries.push(entry);
  }
  // キーを降順ソート（新しい週が上）
  return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}
```

---

## 8. コピー仕様

### 8.1 テキストコピーフォーマット（行動記録）

日付は**降順**（新しい日付が先）。画面表示と同じ並び順にする。

**空欄ルール:**

| フィールド | 空のときのコピー表現 |
|-----------|-----------------|
| 開始時間・終了時間 | `--:--` |
| 翌時刻（25:30 等） | そのまま `25:30` 表示（`翌01:30` には変換しない） |
| 感情 | 省略（`[感情名]` ごと出力しない） |

```
■ 行動・感情記録 2026/02/16 〜 2026/02/22

【2026/02/22 (日) — 今日】
  09:00 〜 10:30  PoC設計書レビュー [集中]
  10:30 〜 12:00  チームMTG [疲れ]
  --:-- 〜 --:--  メモ書き（感情未選択なので感情ラベルなし）

【2026/02/21 (土)】
  09:30 〜 11:00  ドキュメント作成 [集中]
  14:00 〜 15:30  仕様確認MTG [不安]
```

### 8.2 テキストコピーフォーマット（振り返り）

日付は**降順**（行動記録と同様）。

```
■ 振り返り 2026/02/16 〜 2026/02/22

【2026/02/22 (日) — 今日】
  [Keep][仕事] 朝のタスク整理が効果的だった
  [Problem][生活] 昼食後に眠くなり集中が途切れた

【2026/02/21 (土)】
  [Try][仕事] 午後の集中時間を確保する
  [学び][勉強] PoC設計で要件定義の粒度が重要
```

### 8.3 コピーユーティリティ (`src/lib/export.ts`)

```typescript
// fmt は dateUtils.ts の日付フォーマット関数（YYYY-MM-DD を返す）
// groupByDate は entries を date キーでグループ化する

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const now = new Date();
  const todayStr = fmt(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = fmt(yesterday);
  const suffix = dateStr === todayStr ? ' — 今日' : dateStr === yesterdayStr ? ' — 昨日' : '';
  return `${dateStr.replace(/-/g, '/')} (${dayNames[d.getDay()]})${suffix}`;
}

function groupByDate<T extends { date: string }>(entries: T[]): Record<string, T[]> {
  return entries.reduce((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {} as Record<string, T[]>);
}

export function buildLogText(entries: LogEntry[], weekLabel: string): string {
  const header = `■ 行動・感情記録 ${weekLabel}`;
  const byDate = groupByDate(entries);
  const body = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a)) // 降順（新しい日付が先）
    .map(([date, rows]) => {
      const label = formatDateLabel(date);
      const lines = rows.map(e => {
        const start   = e.start_time || '--:--';
        const end     = e.end_time   || '--:--';
        const emotion = e.emotion    ? ` [${e.emotion}]` : '';
        return `  ${start} 〜 ${end}  ${e.action}${emotion}`;
      }).join('\n');
      return `【${label}】\n${lines}`;
    }).join('\n\n');
  return `${header}\n\n${body}`;
}

export function buildRetroText(entries: RetroEntry[], weekLabel: string): string {
  const header = `■ 振り返り ${weekLabel}`;
  const byDate = groupByDate(entries);
  const body = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a)) // 降順（新しい日付が先）
    .map(([date, rows]) => {
      const label = formatDateLabel(date);
      const lines = rows.map(e => `  [${e.type}][${e.category}] ${e.content}`).join('\n');
      return `【${label}】\n${lines}`;
    }).join('\n\n');
  return `${header}\n\n${body}`;
}
```

---

## 9. 認証設計

### 9.1 方針

- Supabase Auth（メールアドレス + パスワード）
- フロントエンド: **`@supabase/ssr`** でセッション管理（`@supabase/auth-helpers-nextjs` は非推奨のため使用しない）
- バックエンド: リクエストの `Authorization: Bearer <jwt>` を `supabase.auth.getUser(jwt)` で検証し `user_id` を取得
- 全テーブルにRLSを適用（`user_id = auth.uid()`）
- 将来的にOAuth（Google等）追加を想定した設計

### 9.2 セッション管理

| トークン種別 | 有効期限（デフォルト） | 役割 |
|------------|-------------------|------|
| アクセストークン（JWT） | 1時間 | APIリクエストの認証 |
| リフレッシュトークン | 60日 | アクセストークンの再発行 |

- `@supabase/ssr` がアクセストークンの期限切れを検知し、**自動でサイレントリフレッシュ**する。ユーザーへの通知・操作中断は発生しない。
- リフレッシュトークンも期限切れ（60日間未使用）の場合のみログイン画面へリダイレクトする。毎日利用する想定のため、実運用上この状態はほぼ発生しない。
- 編集中にトークン切れが起きても自動リフレッシュにより入力内容は失われない。

### 9.3 Next.js ミドルウェアによるルートガード

未認証ユーザーが `/log`・`/retro`・`/settings` にアクセスした場合に `/login` へリダイレクトする。

```typescript
// src/proxy.ts（Next.js 16ではmiddleware.tsではなくproxy.ts、関数名もproxy）
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: '', ...options }),
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // 未ログインで保護対象ページにアクセス → /login へリダイレクト
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  // ログイン済みで /login にアクセス → /log へリダイレクト
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/log', req.url));
  }

  return res;
}

export const config = {
  // 静的ファイル・画像・faviconを除くすべてのパスにミドルウェアを適用
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 9.4 実装する画面

| 画面 | 実装 | 理由 |
|------|------|------|
| ログイン | する | 毎回の認証に必要 |
| サインアップ | しない | 個人利用のためSupabaseダッシュボードでアカウント作成 |
| パスワードリセット | しない | 必要な場合はSupabaseダッシュボードで対処 |

> 将来的に複数ユーザー対応が必要になった時点でサインアップ画面を追加する。

### 9.5 ログイン画面 (`/login`)

**レイアウト:**

```
[ページ背景: --bg + 横ラインテクスチャ]

          ┌────────────────────────┐
          │   Inner Trace          │  ← ロゴ（Shippori Mincho）
          │                        │
          │  メールアドレス         │
          │  [ ___________________ ]│
          │                        │
          │  パスワード             │
          │  [ ___________________ ]│
          │                        │
          │  [ ログイン ]           │  ← --ink 背景・--paper テキスト
          │                        │
          │  （エラー時）           │
          │  メールアドレスまたは   │  ← color: --problem, font-size: 12px
          │  パスワードが正しく     │
          │  ありません             │
          └────────────────────────┘
```

- カードを画面中央（縦横）に配置
- カード: `background: --paper`, `border-radius: 12px`, `padding: 40px`, `width: 360px`
- デザインシステム（配色・フォント）を他画面と統一

**フォーム仕様:**

| 項目 | 要素 | 備考 |
|------|------|------|
| メールアドレス | `<input type="email">` | – |
| パスワード | `<input type="password">` | – |
| ログインボタン | `<button type="submit">` | ローディング中はスピナーを表示してdisabled |

**動作フロー:**

1. フォーム送信 → Supabase Auth でログイン
2. 成功 → `/log` へリダイレクト
3. 失敗 → カード内にエラーメッセージ表示（「メールアドレスまたはパスワードが正しくありません」固定文言。詳細は出さない）

---

## 10. レスポンシブ設計

### 10.1 方針

- **フルレスポンシブ**。スマートフォンでも快適に使えることを目標とする。
- ブレークポイントは **2段階**。`768px` を境にモバイル / デスクトップを切り替える。
  - `< 768px`: モバイルレイアウト
  - `≥ 768px`: デスクトップレイアウト（Tailwind の `md:` プレフィックスに対応）

### 10.2 テーブルのモバイル表示

テーブルは列数が多いため、モバイルでは**横スクロール**で対応する。

```css
/* テーブルラッパーに適用 */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* iOS慣性スクロール */
}
```

- テーブル自体の幅は変えず、コンテナが横スクロールする

### 10.3 各UIのモバイル対応

| UI要素 | デスクトップ | モバイル |
|--------|------------|---------|
| ナビゲーションバー | ロゴ・タブ・日付・歯車を横並び | 日付を非表示にしてロゴ・タブ・歯車のみ |
| WeekGroup ヘッダー | 週ラベル・コピーボタンを横並び | コピーボタンを2行目に折り返し |
| LogRow / RetroRow テーブル | フル表示 | 横スクロール |
| ExpandableCell ポップアップ | `width: 340px`, セル直下（または直上）に表示 | `width: 90vw`, 画面左端5%に表示 |
| 保存ステータスインジケーター | 右下固定 | 右下固定（変更なし） |

### 10.4 ExpandableCell のモバイル・仮想キーボード対応

モバイルではテキストエリアにフォーカスすると仮想キーボードが表示される。`window.innerHeight` はキーボード表示時も変化しないが、`visualViewport.height` は実際の表示領域を正確に返す。`visualViewport` API の `resize` / `scroll` イベントを購読することでポップアップ位置をリアルタイムに更新し、キーボードに隠れることを防ぐ。詳細な実装は §6.5 参照。

---

## 11. デプロイ・インフラ設計

### 11.1 環境変数一覧

#### フロントエンド (`.env.local`)

| 変数名 | 説明 | ローカル開発例 |
|--------|------|--------------|
| `NEXT_PUBLIC_API_BASE_URL` | バックエンドAPIのBase URL | `http://localhost:8080/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（公開鍵） | `eyJ...` |

#### バックエンド (`.env`)

| 変数名 | 説明 | ローカル開発例 |
|--------|------|--------------|
| `SUPABASE_URL` | SupabaseプロジェクトURL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（秘密鍵） | `eyJ...` |
| `PORT` | サーバーポート番号 | `8080` |
| `ALLOWED_ORIGINS` | CORS許可オリジン（カンマ区切り） | `http://localhost:3000` |

### 11.2 ローカル開発環境のセットアップ

```bash
# 1. フロントエンド依存インストール
cd frontend && npm install

# 2. バックエンド依存インストール
cd ../backend && npm install

# 3. 環境変数ファイルを作成（§11.1 を参照して値を設定）
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# 4. バックエンド起動（ts-node で TypeScript を直接実行）
cd backend && npm run dev   # → localhost:8080

# 5. フロントエンド起動
cd frontend && npm run dev  # → localhost:3000
```

> Supabase は Dev プロジェクトをそのまま使用する（ローカルのSupabase CLIは使用しない）。
> DB初期化（テーブル作成・RLS・Trigger）はSupabaseダッシュボードのSQL Editorで §3 の SQLを実行する。

### 11.3 Vercel（フロントエンド）

- Next.js App Routerをそのままデプロイ
- 環境変数は Vercel ダッシュボードで設定（§11.1 フロントエンド変数）
- GitHubのmainブランチへのプッシュで自動デプロイ

### 11.4 Cloud Run（バックエンド）

**マルチステージ Dockerfile:**

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build  # tsc → dist/

# 実行ステージ
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

- 環境変数は Cloud Run のシークレット管理で設定
- 最小インスタンス数: 0（コスト最適化）。コールドスタート（初回リクエスト時に数秒の遅延が発生）はフロントのスケルトン表示で吸収する。利用頻度が高まったら `min-instances=1` に変更を検討する。
- GitHub Actionsで `docker build → push → deploy` を自動化

### 11.5 CORS設定

```typescript
// src/index.ts（バックエンド）
import cors from 'cors';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// ローカル開発時は localhost:3000 を自動追加
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
```

| 環境 | 許可オリジン |
|------|------------|
| development | `http://localhost:3000` |
| staging | `https://staging.inner-trace.vercel.app` |
| production | `https://inner-trace.app` |

### 11.6 環境構成

| 環境 | フロントエンド | バックエンド | DB |
|------|--------------|------------|-----|
| development | localhost:3000 | localhost:8080 | Supabase Devプロジェクト |
| staging | staging.inner-trace.vercel.app | api-staging.inner-trace.app/v1 | Supabase Stagingプロジェクト |
| production | inner-trace.app | api.inner-trace.app/v1 | Supabase Productionプロジェクト |

---

## 12. 開発ロードマップ

| フェーズ | 内容 | 目安期間 |
|---------|------|---------|
| Phase 1 | DB設計・Supabaseセットアップ（テーブル作成・RLS・Trigger）・API基盤 | 1週間 |
| Phase 2 | 行動記録・振り返りCRUD（フロントエンド） | 1〜2週間 |
| Phase 3 | 週グルーピング・折りたたみ・コピー機能 | 1週間 |
| Phase 4 | 設定管理画面（感情・タイプ・カテゴリのCRUD） | 3〜5日 |
| Phase 5 | 認証・Vercel / Cloud Runデプロイ | 3〜5日 |
| Phase 6 | テスト・バグ修正・UI改善 | 随時 |

---

## 13. 今後の拡張候補

- AIによる週次サマリー生成（Claude API連携）
- 感情スコアの推移グラフ表示
- モバイルアプリ（React Native）
- チーム・複数ユーザー対応（サインアップ画面の追加）
- Slack・Notionへのエクスポート連携
- オプション並び替えUI（ドラッグ&ドロップ、`sort_order` の更新API追加）

---

*── 以上 ──*
