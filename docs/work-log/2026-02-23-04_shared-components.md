# 作業ログ 2026-02-23-04 — 共通コンポーネント（WBS 2.x）

## やったこと

### インストール

```bash
npm install swr  # useSWRInfinite のため
```

### 作成ファイル一覧

| ファイル | WBS | 内容 |
|---------|-----|------|
| `src/lib/dateUtils.ts` | – | `fmt` / `today` / `formatDateLabel` / `getWeekRange` / `groupByWeek` / `groupByDate` |
| `src/contexts/SaveStatusContext.tsx` | 2.2 | idle / saving / saved / error の4状態 Context |
| `src/components/shared/NavBar.tsx` | 2.1 | fixed 上部ナビ、タブ切り替え、日付・設定アイコン |
| `src/components/shared/SaveStatusIndicator.tsx` | 2.2 | 右下固定ステータス表示 |
| `src/components/shared/WeekGroup.tsx` | 2.3 | 折りたたみ/展開、max-height アニメーション |
| `src/components/shared/CopyButton.tsx` | 2.5 | 2.5秒フィードバック付きコピーボタン |
| `src/components/shared/ExpandableCell.tsx` | 2.4 | fixed popup、IME デバウンス、visualViewport 追従 |

`layout.tsx` も更新し、SaveStatusProvider / NavBar / SaveStatusIndicator を配置。

### 各コンポーネントの設計ポイント

**NavBar:**
- `usePathname()` でアクティブタブを判定（外部コールバック不要）
- 日付は `md:` ブレークポイント以上でのみ表示
- タブ切り替えは `bg-paper` のピル型コンテナ + アクティブ時 `bg-bg shadow`

**WeekGroup:**
- 折りたたみは `max-height: 0 ↔ 2000px` + `transition-all duration-300 ease-in-out`
- コピーボタンのクリックが WeekGroup のトグルに伝播しないよう `stopPropagation`

**ExpandableCell:**
- IME 変換中（`isComposing.current = true`）は debounce タイマーを起動しない
- `compositionend` 後に debounce タイマーを起動する
- blur 時は debounce をキャンセルして即時保存し、120ms 後にポップアップを閉じる
- `visualViewport` の `resize` / `scroll` イベントを購読してモバイルキーボード表示時の位置ずれを防ぐ
- `onMouseDown={e => e.preventDefault()}` をポップアップのフッター div にのみ適用（textarea のフォーカスを奪わない）
- `autoOpen` prop: マウント直後に一度だけ `handleOpen()` を呼ぶ（仮行の action セル用）

**SaveStatusContext:**
- `setSaved` は3秒後に自動で `idle` に戻す
- 将来的に `setError` にリトライコールバックを渡す設計に拡張予定

### debounce 実装

lodash に依存せず自前実装：

```typescript
function makeDebounce<T extends (...args: Parameters<T>) => void>(fn, wait) {
  let timer = null;
  const debounced = (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
  debounced.cancel = () => { clearTimeout(timer); timer = null; };
  return debounced;
}
```

## 決定事項

- `groupByWeek` / `groupByDate` は log・retro 両方で使うため `dateUtils.ts` に置く
- `SaveStatusContext` は layout.tsx で Provider を配置し、全ページで参照可能にする
- `ExpandableCell` の debounce 待機時間は **800ms**（IME 確定 + 入力停止の両方に対応）

## メモ

- Tailwind v4 では `bg-paper/60` のような透明度修飾子も使える（`bg-paper` + 60% 不透明）
- `font-mono` クラスは `@theme` で定義した `--font-mono: var(--font-source-code-pro)` を使う
