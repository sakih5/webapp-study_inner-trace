# WSL2でdotenvの環境変数が反映されないときの原因と対策

## 本記事を作成した背景

Node.js + Express のバックエンドをローカルで起動したところ、Supabase へのクエリが 500 エラーになりました。
`.env` ファイルには正しい値が書いてあるにもかかわらず、バックエンドが古い Supabase プロジェクトのURLに接続しようとしていることがわかりました。
調査の結果、WSL2 のシェルに残っていた環境変数が `.env` より優先されていたことが原因でした。
同じ落とし穴にはまらないよう、原因・診断方法・再発防止策をまとめます。

## 本記事で取り組んだこと

- dotenv が既存のシェル環境変数を上書きしない仕様を理解する
- 古い環境変数を `unset` してバックエンドを正常起動させる
- direnv を使って `cd` するたびに自動で `unset` + `.env` 読み込みを行う仕組みを整える

## 手順

### 前提

- **環境**: Windows 11 + WSL2 (Ubuntu 24.04)
- **前提知識**: Node.js / npm の基本操作がわかる、シェルの環境変数の概念がわかる
- **前提状態**: Node.js + Express バックエンドが `dotenv` を使って `.env` を読み込む構成になっている

### 1. 症状の確認と切り分け

#### 🎯 目的

500 エラーの原因がバックエンド側にあることを確認し、どのレイヤーで問題が起きているかを絞り込む。

#### 🛠️ 手順詳細

まずバックエンドが起動しているかを確認する。

```bash
curl -s http://localhost:8080/v1/log -H "Authorization: Bearer dummy" -w "\nHTTP %{http_code}"
```

- `HTTP 401` が返れば → バックエンドは起動している（認証エラーは正常）
- `curl: (7) Failed to connect` → バックエンド自体が起動していない

次にブラウザの開発者ツール（F12）を開き、Console タブでエラー内容を確認する。

```
GET http://localhost:8080/v1/log?from=...&to=... 500 (Internal Server Error)
```

バックエンドのターミナルに出力される `console.error` を確認し、Supabase クライアントのエラー詳細を読む。

#### 💡 理解ポイント

- ブラウザの Network タブにリクエストが出ているのに 500 が返る → フロントエンドではなくバックエンドの問題
- バックエンドの `console.error` が最も詳しい情報を持っている

#### 📝 補足

Network タブには何も出ていないように見えても、Console タブにはエラーが記録されていることがある。両方を確認する癖をつけると良い。

---

### 2. 原因の特定: dotenv はシェル変数を上書きしない

#### 🎯 目的

なぜ `.env` に正しい値を書いているのに反映されないのかを理解する。

#### 🛠️ 手順詳細

現在のシェルに問題の変数が残っていないか確認する。

```bash
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

古いプロジェクトの値が表示された場合、それが原因。

#### 💡 理解ポイント

`dotenv` は `process.env` に変数をセットする際、**すでに値が存在する変数はスキップする**仕様になっている。

```js
// dotenv の内部動作（擬似コード）
if (process.env[key] === undefined) {
  process.env[key] = valueFromFile;
}
```

WSL2 のターミナルでは、以前のセッションや `.bashrc` で `export` した変数がシェルに残り続ける。
新しいプロジェクトの `.env` を用意しても、シェル変数の方が優先されてしまう。

#### 📝 補足

Node.js に限らず、Python の `python-dotenv` や Ruby の `dotenv` gem も同様の仕様。
「`.env` を直したのに反映されない」という場合は、シェル変数の確認が最初のチェックポイントになる。

---

### 3. 即時対応: unset で古い変数を削除

#### 🎯 目的

シェルに残っている古い変数を削除し、`.env` の値が正しく読み込まれるようにする。

#### 🛠️ 手順詳細

バックエンドを停止（`Ctrl+C`）してから以下を実行し、再起動する。

```bash
unset SUPABASE_URL
unset SUPABASE_SERVICE_ROLE_KEY
unset SUPABASE_ANON_KEY
npm run dev
```

#### 💡 理解ポイント

`unset` はそのシェルセッション内でのみ変数を削除する。ターミナルを閉じて開き直すと変数は消えるが、`.bashrc` や `.bash_profile` に `export` が書かれている場合は再度セットされる。

#### 📝 補足

毎回手動で `unset` するのは手間がかかるため、次の手順で自動化することを推奨。

---

### 4. 恒久対応: direnv で cd 時に自動実行する

#### 🎯 目的

バックエンドディレクトリに入るたびに自動で `unset` + `.env` 読み込みが走るようにし、手動作業をなくす。

#### 🛠️ 手順詳細

**direnv のインストール**

```bash
sudo apt install direnv
```

**シェルへのフック追加**

```bash
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc
```

**`.envrc` の作成**

バックエンドディレクトリに `.envrc` を作成する。

```plaintext
unset SUPABASE_URL
unset SUPABASE_SERVICE_ROLE_KEY
unset SUPABASE_ANON_KEY
dotenv
```

`dotenv` は direnv の組み込みコマンドで、`.env` ファイルを読み込んで環境変数にセットする。

**許可の付与**

```bash
cd /path/to/backend
direnv allow .
```

これ以降、`backend/` に `cd` するたびに `.envrc` が自動実行される。ディレクトリを出ると変数は元の状態に戻る。

#### 💡 理解ポイント

direnv はディレクトリ単位で環境変数を管理するツール。`.envrc` を `direnv allow` で明示的に許可しないと実行されない（セキュリティ上の仕様）。

#### 📝 補足

VSCode の統合ターミナルから起動している場合、direnv のフックが効かないことがある。その場合はターミナルを bash で開き直すか、`.bashrc` の先頭付近にフック行を書く。

## 学び・次に活かせる知見

- `dotenv` はシェル変数を上書きしない。「`.env` を直したのに反映されない」ときはまずシェル変数を疑う
- 複数プロジェクトを切り替えながら開発するときは、プロジェクトごとに direnv を使うと環境変数の混在を防げる
- バックエンドのエラー調査は「ブラウザ Console → バックエンドターミナルの console.error」の順に確認すると効率的

## 参考文献

1. [direnv 公式ドキュメント](https://direnv.net/)
2. [motdotla/dotenv — README (Priority section)](https://github.com/motdotla/dotenv#how-dotenv-works)

## 更新履歴

- 2026-03-01：初版作成
