# 作業ログ 2026-02-23-02 — デザインシステム（WBS 1.2）

## やったこと

### フォント選定（2回変更）

当初設計書にあった **Shippori Mincho** を使用せず、以下の経緯で最終決定した。

| 段階 | UI フォント | Mono フォント | 理由 |
|------|------------|--------------|------|
| 設計書 v1.1 | Shippori Mincho | DM Mono | 元の設計 |
| 第1変更 | Noto Sans JP | DM Mono | Shippori Mincho が嫌とのユーザー希望 |
| 第2変更 | **Inter + Noto Sans JP** | **Source Code Pro** | ChatGPT 風デザインに全面変更 |

**最終フォント構成:**
- UI（Latin・数字）: **Inter**
- 日本語フォールバック: **Noto Sans JP**（`next/font/google` で読み込み）
- モノスペース（時刻・ラベル・テーブルヘッダー等）: **Source Code Pro**

### カラーパレット変更（ChatGPT 風に）

| 変数 | 変更前（和紙風） | 変更後（ChatGPT 風） |
|------|-----------------|---------------------|
| `--bg` | `#F5F0E8` | `#FFFFFF` |
| `--paper` | `#FDFBF7` | `#F4F4F4` |
| `--ink` | `#1A1410` | `#0D0D0D` |
| `--ink-light` | `#6B5E52` | `#8E8EA0` |
| `--accent` | `#C84B2F`（赤系） | `#10A37F`（ChatGPT グリーン） |
| `--border` | `#D4C9B8` | `#E5E5E5` |
| `--keep` | `#2D6A4F` | `#10A37F`（accent と同値） |
| `--problem` | `#C84B2F` | `#EF4146` |

### 背景テクスチャの削除

設計書にあった和紙風の横ライン（`repeating-linear-gradient`）を廃止し、白一色の背景に変更。

### Tailwind v4 対応

- 設定ファイルは `tailwind.config.ts` ではなく `globals.css` 内の `@theme inline` ブロックで行う
- `--color-X` 変数を定義すると `text-X` / `bg-X` / `border-X` クラスが自動生成される
- `@theme` に対して VS Code が "Unknown at rule" 警告を出すが、Tailwind v4 の正規構文のため無視してよい

### 変更したファイル

| ファイル | 変更内容 |
|---------|---------|
| `docs/design.md` | フォント名・カラー値・テクスチャ説明・各所フォント参照を更新 |
| `frontend/src/app/globals.css` | CSS変数・`@theme` 定義・body スタイル |
| `frontend/src/app/layout.tsx` | フォントimport・メタデータ・`lang="ja"` |

## 決定事項

- Inter は Latin 文字のみカバーするため、Noto Sans JP を Japanese フォールバックとして併用する
- `font-family: var(--font-inter), var(--font-noto-sans-jp), sans-serif` の順で body に適用
- Tailwind の `font-mono` クラスは Source Code Pro を使う（`--font-mono: var(--font-source-code-pro)`）
