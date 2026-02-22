# 日々 — 設計書 v1.0

> 行動・感情記録 & 振り返りWebアプリケーション  
> 作成日: 2026-02-22

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [システムアーキテクチャ](#2-システムアーキテクチャ)
3. [データベース設計](#3-データベース設計)
4. [API設計](#4-api設計)
5. [画面設計](#5-画面設計)
6. [コンポーネント設計](#6-コンポーネント設計)
7. [状態管理設計](#7-状態管理設計)
8. [コピー・エクスポート仕様](#8-コピーエクスポート仕様)
9. [認証設計](#9-認証設計)
10. [デプロイ・インフラ設計](#10-デプロイインフラ設計)
11. [開発ロードマップ](#11-開発ロードマップ)
12. [今後の拡張候補](#12-今後の拡張候補)

---

## 1. プロジェクト概要

### 1.1 コンセプト

「日々」は仕事・生活の中で自分を見失わないための、毎日の記録と振り返りツールです。  
まず記録する習慣をつけやすい、シンプルかつ素早い入力UXを最優先とし、  
週次サマリーをAI等の外部ツールにコピー・エクスポートしやすい設計にします。

### 1.2 主要機能

| 機能 | 説明 |
|------|------|
| 行動・感情記録 | 日付・開始時間・終了時間・行動・感情を1行ずつ記録。過去日入力対応 |
| 振り返り記録 | KPT（Keep/Problem/Try）+ 学びをカテゴリ付きで記録 |
| 週グルーピング表示 | 週ごとにグループ化し折りたたみ/展開可能。最新週がデフォルト展開 |
| クリップボードコピー | 週単位または任意日付範囲のデータをテキスト形式でコピー |
| CSVエクスポート | 週単位または任意日付範囲のデータをCSVでダウンロード |
| データ永続化 | Supabase PostgreSQLに保存 |

---

## 2. システムアーキテクチャ

### 2.1 技術スタック

| レイヤー | 技術 | バージョン | 役割 |
|----------|------|-----------|------|
| フロントエンド | Next.js (App Router) | 14.x | UIレンダリング・ルーティング |
| フロントエンド | TypeScript | 5.x | 型安全なコード記述 |
| フロントエンド | Tailwind CSS | 3.x | スタイリング |
| バックエンド | Node.js + Express | 20.x / 4.x | REST APIサーバー |
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
    log/
      page.tsx              # 行動・感情記録画面
    retro/
      page.tsx              # 振り返り画面
  components/
    log/
      WeekGroup.tsx         # 週グループ（折りたたみ対応）
      LogRow.tsx            # 1行分の行動記録
      AddLogButton.tsx      # 記録追加ボタン
      ActionCell.tsx        # クリック展開テキストエリアセル
    retro/
      WeekGroup.tsx         # 振り返り用週グループ
      RetroRow.tsx          # 1行分の振り返り記録
      AddRetroButton.tsx    # 振り返り追加ボタン
      ContentCell.tsx       # クリック展開テキストエリアセル
    shared/
      NavBar.tsx            # 上部ナビゲーションバー
      DateRangeExportModal.tsx  # 日付範囲コピー・エクスポートモーダル
      CopyButton.tsx        # コピー完了フィードバック付きボタン
  lib/
    api.ts                  # APIクライアント（fetch wrapper）
    export.ts               # CSV・テキストエクスポートユーティリティ
    types.ts                # 共有型定義
    dateUtils.ts            # 日付操作ユーティリティ
  hooks/
    useLog.ts               # 行動記録カスタムフック（SWR）
    useRetro.ts             # 振り返りカスタムフック（SWR）
```

#### バックエンド (Express + TypeScript)

```
src/
  routes/
    log.ts                  # 行動記録 CRUD
    retro.ts                # 振り返り CRUD
  middleware/
    auth.ts                 # JWTバリデーションミドルウェア
    validate.ts             # リクエストバリデーション
  db/
    supabase.ts             # Supabaseクライアント初期化
  types/
    index.ts                # 型定義
  index.ts                  # エントリポイント
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
  start_time  time        NULL,
  end_time    time        NULL,
  action      text        NULL,
  emotion     text        NULL CHECK (emotion IN (
                '—','集中','普通','疲れ','不安','嬉しい','達成感','焦り','つらい','やる気','リラックス'
              )),
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
  type        text        NOT NULL CHECK (type IN ('keep', 'problem', 'try', '学び')),
  category    text        NOT NULL CHECK (category IN ('仕事', '勉強', '生活')),
  content     text        NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_retro_user_date ON retro_entries (user_id, date DESC);
```

### 3.3 共通設定

```sql
-- updated_at 自動更新トリガー（両テーブルに適用）
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

---

## 4. API設計

### 4.1 共通仕様

- Base URL: `https://api.nichijo.app/v1`
- 認証: `Authorization: Bearer <supabase_jwt>`
- Content-Type: `application/json`
- エラー形式: `{ "error": { "code": "string", "message": "string" } }`

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
  "type": "keep",
  "category": "仕事",
  "content": "朝のタスク整理が効果的だった"
}
```

---

## 5. 画面設計

### 5.1 デザインシステム

#### カラーパレット

| 変数名 | 値 | 用途 |
|--------|-----|------|
| `--bg` | `#F5F0E8` | ページ背景（和紙テクスチャ） |
| `--paper` | `#FDFBF7` | カード・テーブル背景 |
| `--ink` | `#1A1410` | メインテキスト・ボタン背景 |
| `--ink-light` | `#6B5E52` | サブテキスト・ラベル |
| `--accent` | `#C84B2F` | アクセント（展開中ボーダー・ロゴ） |
| `--border` | `#D4C9B8` | テーブルボーダー・区切り線 |
| `--keep` | `#2D6A4F` | Keepタイプ |
| `--problem` | `#C84B2F` | Problemタイプ |
| `--try` | `#1A4A7A` | Tryタイプ |
| `--learn` | `#6B3FA0` | 学びタイプ |

#### タイポグラフィ

| 用途 | フォント | サイズ | ウェイト |
|------|---------|--------|---------|
| ロゴ | Shippori Mincho | 20px | 800 |
| 週ラベル・日付ラベル | Shippori Mincho | 13px | 600 |
| ページタイトル | Shippori Mincho | 16px | 600 |
| テーブルヘッダー | DM Mono | 9px | 500（大文字） |
| セル入力・テキスト | DM Mono | 12px | 400 |
| ボタン・ラベル | DM Mono | 10–11px | 400 |

#### 背景テクスチャ

```css
background-image: repeating-linear-gradient(
  0deg, transparent, transparent 27px,
  rgba(180,165,145,0.10) 27px, rgba(180,165,145,0.10) 28px
);
```
横方向の薄いラインで方眼紙・ノートのような雰囲気を表現する。

---

### 5.2 共通レイアウト

#### ナビゲーションバー（固定、高さ54px）

```
|  日々  |  [ 行動・感情記録 | 振り返り ]  |  2026.02.22  |
```

- 左端: ロゴ「日々」（々を--accent色で表示）
- 中央: タブ切り替えUI
  - 2つのボタンを `background: --bg` のピル型コンテナに格納
  - アクティブなタブは `background: --paper` + `box-shadow` で浮き上がり
- 右端: 今日の日付（`YYYY.MM.DD` 形式）

#### フッターバー（固定、下部）

```
|  [未保存の変更があります]  |  [ 保存する ]  |
```

- 右寄せ配置
- 保存ステータステキスト（変更あり時のみ表示、保存後3秒で消える）
- 「保存する」ボタン（`--ink` 背景、`--paper` テキスト）

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

[フッターバー]
```

#### 「＋ 記録を追加」ボタン動作

1. クリックすると新しい空行データを作成
2. 日付はデフォルト「今日」だが変更可能（`<input type="date">`）
3. 新しい行は該当日付のグループの先頭（時間未入力なので最上部）に追加される
4. 行追加後、その行の「行動」セルに自動フォーカス

#### WeekGroup（週グループ）

**ヘッダーの構成:**

```
[ ▼ 📅 2026/02/16 〜 2026/02/22 ]        [ コピー ] [ 範囲指定 ]
```

- クリックで折りたたみ/展開トグル
- アイコン: 展開時 `▼`、折りたたみ時 `▶`
- 週の範囲は月曜日〜日曜日（ISO週）
- ヘッダーボーダー: `border-bottom: 2px solid --ink`
- 右端ボタン群:
  - **「コピー」ボタン**: その週のデータをテキスト形式でクリップボードコピー。クリック後2.5秒間「✓ コピー済」に変化
  - **「範囲指定」ボタン**: DateRangeExportModalを開く

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

ラベルは `font-family: Shippori Mincho`, `font-size: 13px`, `color: --ink-light`  
下線: `border-bottom: 1.5px solid --border`

#### LogRow テーブル

**カラム定義:**

| カラム名 | 幅 | 要素 | 備考 |
|---------|-----|------|------|
| 開始時間 | 80px | `<input type="time">` | 変更時に同日内でリアルタイムソート |
| 終了時間 | 80px | `<input type="time">` | – |
| 行動 | 残り全幅（flex: 1） | ActionCell（展開型テキストエリア） | 後述 |
| 感情 | 110px | `<select>` | 選択肢は下記参照 |
| （削除） | 40px | `×` ボタン | hover時のみ赤く変色 |

**感情選択肢:**

```
—（未選択）/ 集中 / 普通 / 疲れ / 不安 / 嬉しい / 達成感 / 焦り / つらい / やる気 / リラックス
```

**テーブルスタイル:**

- `border-radius: 8px` + `overflow: hidden` をラッパーdivで適用（テーブル自体はoverflowはvisibleを維持してActionCellの展開を妨げない）
- ヘッダー行: `background: #F0EBE0`
- 奇数行: `--paper`、偶数行: `--bg`
- hover: `background: rgba(245,240,232,0.5)`

**日付フィールド（行の先頭列として追加）:**

記録追加時には日付も編集できるようにするため、各行に日付列も表示する。  
ただし同日グループ内では同じ日付が並ぶため、**最初の行のみ表示し残りはグレーアウト**するか、  
あるいは**日付列は常に表示**して視認性を保つかはUX検討が必要。  
→ **推奨: 常に表示。日付を変更すると別の日付グループに移動する。**

| カラム名 | 幅 | 要素 |
|---------|-----|------|
| 日付 | 100px | `<input type="date">` |
| 開始時間 | 80px | `<input type="time">` |
| 終了時間 | 80px | `<input type="time">` |
| 行動 | 残り全幅 | ActionCell |
| 感情 | 110px | `<select>` |
| （削除） | 40px | `×` ボタン |

#### ActionCell（行動セルの展開動作）

通常状態: テキストをプレビュー表示（overflow: hidden, text-overflow: ellipsis）  
展開状態: `position: fixed` のポップアップテキストエリアを表示

**展開ロジック（詳細）:**

1. セルをクリック → `open` クラスを付与
2. `getBoundingClientRect()` でセルの画面上の座標を取得
3. 展開エリアを `position: fixed` で配置
   - `top`: `rect.bottom + 4px`（セルの真下）
   - `left`: `rect.left`（左端を合わせる）
   - 右端が viewport を超える場合: `left = viewport.width - popupWidth - 12px`
   - `width`: 340px 固定
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

[フッターバー]
```

#### RetroRow テーブル

**カラム定義:**

| カラム名 | 幅 | 要素 | 備考 |
|---------|-----|------|------|
| 日付 | 100px | `<input type="date">` | デフォルト今日、変更可 |
| タイプ | 110px | `<select>` | Keep / Problem / Try / 学び |
| カテゴリ | 90px | `<select>` | 仕事 / 勉強 / 生活 |
| 振り返り内容 | 残り全幅 | ContentCell（展開型テキストエリア） | ActionCellと同じ動作 |
| （削除） | 40px | `×` ボタン | – |

**タイプ選択肢と色:**

| 値 | 表示名 | バッジ色 |
|----|--------|---------|
| keep | Keep | `background: #D4EDE0`, `color: --keep` |
| problem | Problem | `background: #F5D4CC`, `color: --problem` |
| try | Try | `background: #C8D8EC`, `color: --try` |
| 学び | 学び | `background: #E8D8F5`, `color: --learn` |

タイプ列のセレクトボックスは、選択されたタイプに応じてバッジ風のカラーでセル内を着色することが望ましい（任意実装）。

#### ContentCell

ActionCellと全く同じ動作・スタイルを使用。コンポーネント化して共通化する。

---

### 5.5 DateRangeExportModal（日付範囲コピー・エクスポート）

WeekGroupの「範囲指定」ボタンまたは各タブの任意のタイミングで開けるモーダル。

**モーダルの構成:**

```
┌──────────────────────────────────────────┐
│  日付範囲を指定してコピー・エクスポート   │  ← タイトル
├──────────────────────────────────────────┤
│                                          │
│  開始日  [ 2026-02-16 ▼ ]               │
│  終了日  [ 2026-02-22 ▼ ]               │
│                                          │
│  対象:  ● 行動・感情記録  ○ 振り返り     │  ← ラジオボタン
│         ○ 両方                          │
│                                          │
├──────────────────────────────────────────┤
│  [ クリップボードにコピー ]  [ CSVダウンロード ]  │
└──────────────────────────────────────────┘
```

- 開始日・終了日: `<input type="date">`
- モーダル外クリック・ESCキーで閉じる
- コピーボタン: クリック後2.5秒間「✓ コピー済」に変化
- CSVダウンロード: 対象が「両方」の場合はZIPでまとめてダウンロード（または個別2ファイル）

---

## 6. コンポーネント設計

### 6.1 共通型定義 (`src/lib/types.ts`)

```typescript
export type Emotion =
  '—' | '集中' | '普通' | '疲れ' | '不安' |
  '嬉しい' | '達成感' | '焦り' | 'つらい' | 'やる気' | 'リラックス';

export type RetroType = 'keep' | 'problem' | 'try' | '学び';
export type RetroCategory = '仕事' | '勉強' | '生活';

export interface LogEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  start_time: string;    // HH:MM or ''
  end_time: string;      // HH:MM or ''
  action: string;
  emotion: Emotion;
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

```typescript
// props
interface NavBarProps {
  activeTab: 'log' | 'retro';
  onTabChange: (tab: 'log' | 'retro') => void;
}
```

- `position: fixed`, `z-index: 200`, `height: 54px`
- タブ切り替え時は `router.push('/log')` or `router.push('/retro')`

### 6.3 WeekGroup (`src/components/log/WeekGroup.tsx`)

```typescript
interface WeekGroupProps {
  week: WeekRange;
  entries: LogEntry[];          // この週に属するエントリ全件
  defaultOpen?: boolean;        // デフォルト展開（最新週のみtrue）
  onUpdate: (entry: LogEntry) => void;
  onDelete: (id: string) => void;
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

### 6.5 ActionCell / ContentCell

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
const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
const cellRef = useRef<HTMLTableCellElement>(null);
const textareaRef = useRef<HTMLTextAreaElement>(null);
```

**展開時のスタイル計算:**
```typescript
const handleOpen = () => {
  if (!cellRef.current) return;
  const rect = cellRef.current.getBoundingClientRect();
  const popupWidth = 340;
  const left = rect.left + popupWidth > window.innerWidth
    ? window.innerWidth - popupWidth - 12
    : rect.left;
  setPopupStyle({
    position: 'fixed',
    top: rect.bottom + 4,
    left,
    width: popupWidth,
    zIndex: 500,
  });
  setIsOpen(true);
  setTimeout(() => textareaRef.current?.focus(), 10);
};
```

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

---

## 7. 状態管理設計

### 7.1 データ取得・キャッシュ（SWR）

```typescript
// src/hooks/useLog.ts
export function useLog(from: string, to: string) {
  const { data, error, mutate } = useSWR<LogEntry[]>(
    `/log?from=${from}&to=${to}`,
    fetcher
  );

  const add = async (entry: Omit<LogEntry, 'id'>) => {
    const newEntry = await api.post<LogEntry>('/log', entry);
    mutate(); // キャッシュ再検証
    return newEntry;
  };

  const update = async (id: string, patch: Partial<LogEntry>) => {
    // 楽観的更新
    mutate(
      data?.map(e => e.id === id ? { ...e, ...patch } : e),
      false
    );
    await api.patch(`/log/${id}`, patch);
    mutate(); // 再検証
  };

  const remove = async (id: string) => {
    mutate(data?.filter(e => e.id !== id), false);
    await api.delete(`/log/${id}`);
    mutate();
  };

  return { entries: data ?? [], isLoading: !data && !error, add, update, remove };
}
```

### 7.2 ソートロジック

```typescript
// 行動記録: 日付降順 → 同日内は開始時間降順（新しい時間が上）
function sortLogEntries(entries: LogEntry[]): LogEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    const at = a.start_time || '99:99';
    const bt = b.start_time || '99:99';
    return bt.localeCompare(at);
  });
}

// 振り返り: 日付降順のみ
function sortRetroEntries(entries: RetroEntry[]): RetroEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}
```

### 7.3 週グルーピングロジック

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

## 8. コピー・エクスポート仕様

### 8.1 テキストコピーフォーマット（行動記録）

```
■ 行動・感情記録 2026/02/16 〜 2026/02/22

【2026/02/22 (日) — 今日】
  09:00 〜 10:30  PoC設計書レビュー  [集中]
  10:30 〜 12:00  チームMTG  [疲れ]
  13:00 〜 14:00  メールチェック・返信  [普通]

【2026/02/21 (土)】
  09:30 〜 11:00  ドキュメント作成  [集中]
  14:00 〜 15:30  仕様確認MTG  [不安]
```

### 8.2 テキストコピーフォーマット（振り返り）

```
■ 振り返り 2026/02/16 〜 2026/02/22

【2026/02/22 (日) — 今日】
  [Keep][仕事] 朝のタスク整理が効果的だった
  [Problem][生活] 昼食後に眠くなり集中が途切れた

【2026/02/21 (土)】
  [Try][仕事] 午後の集中時間を確保する
  [学び][勉強] PoC設計で要件定義の粒度が重要
```

### 8.3 CSVフォーマット（行動記録）

```csv
date,start_time,end_time,action,emotion
2026-02-22,09:00,10:30,PoC設計書レビュー,集中
2026-02-22,10:30,12:00,チームMTG,疲れ
2026-02-21,09:30,11:00,ドキュメント作成,集中
```

### 8.4 CSVフォーマット（振り返り）

```csv
date,type,category,content
2026-02-22,keep,仕事,朝のタスク整理が効果的だった
2026-02-22,problem,生活,昼食後に眠くなり集中が途切れた
2026-02-21,try,仕事,午後の集中時間を確保する
```

### 8.5 エクスポートユーティリティ (`src/lib/export.ts`)

```typescript
export function buildLogText(entries: LogEntry[], weekLabel: string): string {
  const header = `■ 行動・感情記録 ${weekLabel}`;
  const byDate = groupByDate(entries);
  const body = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => {
      const label = formatDateLabel(date);
      const lines = rows.map(e =>
        `  ${e.start_time || '--:--'} 〜 ${e.end_time || '--:--'}  ${e.action || '(未入力)'}  [${e.emotion}]`
      ).join('\n');
      return `【${label}】\n${lines}`;
    }).join('\n\n');
  return `${header}\n\n${body}`;
}

export function buildRetroText(entries: RetroEntry[], weekLabel: string): string { /* 同様 */ }

export function buildLogCSV(entries: LogEntry[]): string {
  const header = 'date,start_time,end_time,action,emotion';
  const rows = entries.map(e =>
    [e.date, e.start_time, e.end_time, `"${e.action}"`, e.emotion].join(',')
  );
  return [header, ...rows].join('\n');
}

export function buildRetroCSV(entries: RetroEntry[]): string { /* 同様 */ }

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' }); // BOM付きでExcel対応
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

---

## 9. 認証設計

- Supabase Auth（メールアドレス + パスワード）
- フロントエンド: `@supabase/auth-helpers-nextjs` でセッション管理
- バックエンド: リクエストの `Authorization: Bearer <jwt>` を `supabase.auth.getUser(jwt)` で検証し `user_id` を取得
- 全テーブルにRLSを適用（`user_id = auth.uid()`）
- 将来的にOAuth（Google等）追加を想定した設計

---

## 10. デプロイ・インフラ設計

### 10.1 Vercel（フロントエンド）

- Next.js App Routerをそのままデプロイ
- 環境変数:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- GitHubのmainブランチへのプッシュで自動デプロイ

### 10.2 Cloud Run（バックエンド）

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

- 環境変数: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT=8080`
- 最小インスタンス数: 0（コスト最適化）
- GitHub Actionsで `docker build → push → deploy` を自動化

### 10.3 環境構成

| 環境 | フロントエンド | バックエンド | DB |
|------|--------------|------------|-----|
| development | localhost:3000 | localhost:8080 | Supabase Devプロジェクト |
| staging | staging.nichijo.vercel.app | Cloud Run (staging) | Supabase Stagingプロジェクト |
| production | nichijo.app | api.nichijo.app | Supabase Productionプロジェクト |

---

## 11. 開発ロードマップ

| フェーズ | 内容 | 目安期間 |
|---------|------|---------|
| Phase 1 | DB設計・Supabaseセットアップ・API基盤 | 1週間 |
| Phase 2 | 行動記録・振り返りCRUD（フロントエンド） | 1〜2週間 |
| Phase 3 | 週グルーピング・折りたたみ・コピー機能 | 1週間 |
| Phase 4 | CSVエクスポート・日付範囲選択モーダル | 3〜5日 |
| Phase 5 | 認証・Vercel / Cloud Runデプロイ | 3〜5日 |
| Phase 6 | テスト・バグ修正・UI改善 | 随時 |

---

## 12. 今後の拡張候補

- AIによる週次サマリー生成（Claude API連携）
- 感情スコアの推移グラフ表示
- モバイルアプリ（React Native）
- チーム・複数ユーザー対応
- Slack・Notionへのエクスポート連携

---

*── 以上 ──*
