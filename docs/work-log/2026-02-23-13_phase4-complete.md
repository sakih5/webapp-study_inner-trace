# 作業ログ 2026-02-23-13 — フェーズ4 統合完了

## やったこと

### C.3 疎通確認（完了）

前回ログ（12）で残っていた 401 → 500 の問題を解決。

### 問題の連鎖と解決

1. **401 Unauthorized**
   - auth.ts にデバッグログを追加して調査
   - トークンは正しく届いていた → auth ミドルウェア自体は問題なし
   - 実は 500 が返っていたが、ネットワークタブが空だったためコンソールで確認

2. **500 Internal Server Error — ENOTFOUND rrtcpgizbgghxylhnvtu.supabase.co**
   - バックエンドのシェルに古い `SUPABASE_URL` 環境変数が残っていた
   - `dotenv` は既存の環境変数を上書きしないため `.env` の正しい値が無視された
   - `unset SUPABASE_URL` で解決

3. **500 Internal Server Error — PGRST002 スキーマキャッシュエラー**
   - Supabase ダッシュボードで "Enable Data API" が OFF になっていた
   - ON に変更して解決
   - `@supabase/supabase-js` は PostgREST（Data API）経由で動作するため、Data API は必須

### 動作確認済み

- ログイン ✓
- GET /v1/log ✓
- POST /v1/log（ログ追加・画面表示）✓

## 現在の状態

全フェーズ完了。アプリケーションはローカルで正常動作中。

## 次のステップ（任意）

- デプロイ（Vercel / Cloud Run）
- 全機能の結合テスト（PATCH・DELETE・retro・settings）
