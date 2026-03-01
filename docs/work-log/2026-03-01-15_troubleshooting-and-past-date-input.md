# 作業ログ 2026-03-01-15 — トラブルシューティング & 過去日付入力機能追加

## やったこと

### 機能追加: 過去日付入力対応

行動記録の仮行（新規追加行）に日付入力欄を追加。
これまでは「＋ 記録を追加」を押すと常に今日の日付で記録が作られていた。

**変更ファイル:**

- `frontend/src/components/log/LogRow.tsx`
  - `onDateChange?: (date: string) => void` prop を追加
  - 仮行のみ、テーブル先頭に `<tr colSpan={5}>` で日付入力欄を表示
  - `Fragment` を使って複数 `<tr>` を返す

- `frontend/src/app/log/page.tsx`
  - `getWeekRange` をインポートして `provisionalWeekKey` を計算
  - 仮行の `LogRow` に `onDateChange` を渡す
  - 仮行が含まれる週グループは必ず展開状態になるよう `defaultOpen` を調整

**動作:**
1. 「＋ 記録を追加」→ 仮行上部に日付 `<input type="date">` が表示（デフォルト: 今日）
2. 日付を変更すると仮行が該当週グループに自動移動
3. 行動を入力・保存すると選択した日付で DB に登録

---

### トラブルシューティング: ローカル dev 起動後に 500 エラー

#### 症状

- `http://localhost:3000/log` で「データを取得できませんでした」
- `/login` に移動すると `/log` にリダイレクトされる（セッションは生きていた）

#### 診断の流れ

1. **Supabase プロジェクトの状態確認** → Active（問題なし）
2. **バックエンドへの疎通確認**
   ```bash
   curl -s http://localhost:8080/v1/log -H "Authorization: Bearer dummy" -w "\nHTTP %{http_code}"
   # → {"error":{"code":"UNAUTHORIZED","message":"Invalid token"}}
   ```
   バックエンドは起動・応答していた。
3. **ブラウザ開発者ツール（Network タブ）** → リクエスト自体は出ていた
4. **ブラウザ開発者ツール（Console タブ）**
   ```
   GET http://localhost:8080/v1/log?from=...&to=... 500 (Internal Server Error)
   ```
5. **バックエンドターミナルの `console.error` 出力**を確認 → Supabase クエリエラー

#### 原因と解決

シェルに古い `SUPABASE_URL`（別プロジェクト用）が環境変数として残っており、
`dotenv` が `.env` の正しい値で上書きできていなかった。

```bash
unset SUPABASE_URL
unset SUPABASE_SERVICE_ROLE_KEY
unset SUPABASE_ANON_KEY
npm run dev   # 再起動
```

で解決。

> **既知の問題（MEMORY にも記録済み）:** dotenv は既にシェルに設定されている変数を上書きしない。
> バックエンド起動前に古い変数を `unset` する必要がある。

#### 再発防止: direnv の導入

`backend/.envrc` を作成し、`cd backend/` するたびに自動で `unset` + `.env` 読み込みが走るよう設定。

```bash
# .envrc
unset SUPABASE_URL
unset SUPABASE_SERVICE_ROLE_KEY
unset SUPABASE_ANON_KEY
dotenv
```

セットアップ手順:
```bash
sudo apt install direnv
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc
cd backend/
direnv allow .
```
