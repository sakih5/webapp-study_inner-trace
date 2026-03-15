# 作業ログ 2026-03-05-16 — トラブルシューティング: direnv 未インストールによる 500 エラー

## 症状

ローカル開発環境で `/log` ページを開くと「データを取得できませんでした」と表示。

## 診断の流れ

1. **バックエンド起動確認**
   ```bash
   curl -s http://localhost:8080/v1/log -H "Authorization: Bearer dummy" -w "\nHTTP %{http_code}"
   ```
   → `{"error":{"code":"UNAUTHORIZED"...}}` — 起動済み、疎通OK

2. **バックエンドターミナルの確認** → `500 Internal Server Error` が出ていた

3. **シェルの環境変数確認**
   ```bash
   echo $SUPABASE_URL
   # → https://rrtcpgizbgghxylhnvtu.supabase.co（古い別プロジェクトの値）
   ```
   正しい URL は `https://svbqeyjeuepzuluqjmwz.supabase.co` のはずなので、古い値が残っていた。

## 原因

前回（作業ログ 15）と同じ問題。シェルに古い `SUPABASE_URL` が残っており、dotenv が `.env` の正しい値で上書きできていなかった。

前回の再発防止策として `direnv` のセットアップを記録していたが、**実際にはインストールが完了していなかった**ため、`.envrc` が機能していなかった。

## 解決手順

### 1. 手動で即時解決

```bash
unset SUPABASE_URL
unset SUPABASE_SERVICE_ROLE_KEY
unset SUPABASE_ANON_KEY
npm run dev
```

### 2. direnv のインストールと設定

```bash
sudo apt install direnv
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc
cd ~/projects/webapp-study_inner-trace/backend
direnv allow .
```

`backend/.envrc` は既に存在していたため、`direnv allow .` のみで有効化できた。

## 確認

`direnv allow .` 後、`cd backend/` するたびに自動で `unset` + `.env` 読み込みが実行されるようになった。
