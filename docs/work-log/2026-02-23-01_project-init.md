# 作業ログ 2026-02-23-01 — プロジェクト初期化（WBS 1.1）

## やったこと

### Next.js プロジェクト作成

```bash
npx create-next-app@latest frontend \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- `frontend/` ディレクトリに配置（将来の `backend/` と並列構成を想定）
- App Router・TypeScript・Tailwind CSS・ESLint を有効化
- `src/` 配下にコードを置く構成

### 判明した事項

- インストールされた Next.js は **v16.1.6**（設計書想定の 14.x より新しい）
- Next.js 16 では `middleware.ts` が **`proxy.ts`** に改名されており、エクスポート関数名も `middleware` → `proxy` に変更
- React Compiler がデフォルト有効になっている（`babel-plugin-react-compiler` がインストールされる）

## 決定事項

- バックエンドと並列配置のため `frontend/` サブディレクトリに Next.js を作成する
- Next.js 16 の新規約に合わせ、ルートガードファイルは `src/proxy.ts` として作成する
- 設計書（§2.3・§9.3）のファイルパスを `middleware.ts` → `proxy.ts` に更新済み
