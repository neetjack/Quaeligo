# Quaeligo

[English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md)

Quaeligo（ラテン語の *Quaero* [探求・問う] ＋ *Colligo* [収集・評価] に由来）は、音声主観評価および聴取実験のためのモダンなオープンソースWebシステムです。ノイズキャンセリング、音声強調、空間オーディオ、音質向上アルゴリズムの主観テストやブラインドテスト向けに設計されており、設问のカスタマイズ、多次元スライダースコア指標、ワンクリックでのデータエクスポートに対応しています。

## 主な機能

- **多次元的な音声テスト**: ブラインドテスト（A/Bテスト）や音質評価（MOS/MUSHRA）などの評価方式に対応。
- **カスタム評価UI**: 設問ごとに異なるタイプ（セマンティックディファレンシャル、基本スコアリングなど）のスライダーを設定可能。
- **多言語対応 (i18n)**: フロントエンドは多言語切り替え機能を内蔵。
- **管理画面**: 設問の作成、音声ファイルのアップロード、評価スケールの設定、回答データのエクスポートが可能。

## 技術スタック

- **言語**: TypeScript (フルスタック)
- **フロントエンド**: React 19, Vite, React Router, i18next
- **バックエンド**: Express 5, Node.js (tsx)
- **データベース**: SQLite, Prisma ORM
- **ファイル保存**: ローカルファイルシステム (multerを使用)
- **認証・セキュリティ**: JWT (JSON Web Tokens), bcryptjs, express-rate-limit

## 動作環境

- **Node.js**: 20以上
- **npm** (推奨) または yarn
- *注: SQLiteを使用しているため、外部データベースを用意しなくてもローカルで直接動かせます。*

## 使い方

### ⚡ クイックスタート

ルートディレクトリにあるスクリプトを使えば、個別のフォルダに入ることなく、**プロジェクトのルート**から一括でセットアップできます：

```bash
# 1. リポジトリのクローン
git clone <your-repository-url>
cd quaeligo

# 2. フロントエンドとバックエンドの依存関係を一括インストール
npm run install:all

# 3. 環境変数とデータベースの初期化 (初回のみ)
cd backend
cp .env.example .env
npx prisma db push
npm run prisma:seed   # デフォルト管理者 (admin / admin123) の初期作成
cd ..

# 4. フロントエンドとバックエンドの開発サーバーを同時に起動
npm run dev
```
バックエンドAPIは `http://localhost:3000`、フロントエンド画面は `http://localhost:5173` で起動します。

---

### ステップごとの手動セットアップ

#### バックエンド

```bash
cd backend
npm install
```

**環境変数の設定**:
サンプルファイルをコピーします：
```bash
cp .env.example .env
```
必要に応じて `.env` を修正します（ローカル開発ならデフォルトのポートと `JWT_SECRET` で十分です）：

| 変数 | 説明 | 例 |
|---|---|---|
| `PORT` | サーバーのポート | `3000` |
| `JWT_SECRET` | JWTの暗号化キー | `your_jwt_secret_key_here` |
| `DATABASE_URL` | SQLiteデータベース接続文字列 | `file:./audiosurvey.db?connection_limit=1&busy_timeout=5000` |
| `CORS_ORIGIN` | 許可するクロスオリジンドメイン（カンマ区切り） | `http://localhost:5173,https://survey.example.com` |

> **CORS設定ガイド (`CORS_ORIGIN`)**:
> - **ローカル開発**: 未設定時は `http://localhost:5173,http://localhost:3000` がデフォルトで許可されます。
> - **本番デプロイ**: 公開ドメインをカンマ区切りで指定します（例: `https://survey.yourdomain.com`）。
> - **Nginxリバースプロキシ構成**: `docker-compose.yml` を使用する場合、フロントエンドとAPIは同一のNginxポートを共有するため、ブラウザからは同一オリジンとして通信され安全です。

**データベースの初期化**:
```bash
# Prismaスキーマの同期
npx prisma db push
```

**サーバーの起動**:
```bash
npm run dev
```

#### フロントエンド

別のターミナルを開きます：

```bash
cd frontend
npm install
```

**Viteサーバーの起動**:
```bash
npm run dev
```

## アーキテクチャ

### ディレクトリ構成

```
├── backend/                  # Express 5 バックエンド
│   ├── prisma/               # PrismaスキーマとSQLiteデータベース
│   │   ├── dev.db            # SQLiteデータベースファイル
│   │   └── schema.prisma     # データモデル定義
│   ├── src/                  # バックエンドのソース
│   │   ├── controllers/      # コントローラーロジック
│   │   ├── middleware/       # JWT認証・レート制限
│   │   ├── utils/            # ユーティリティ (asyncHandlerなど)
│   │   └── index.ts          # Expressエントリーポイント
│   ├── uploads/              # アップロードされた音声ファイル
│   └── package.json
└── frontend/                 # Vite + React フロントエンド
    ├── src/                  # フロントエンドのソース
    │   ├── components/       # 共通UIとチャートコンポーネント
    │   ├── locales/          # i18next 翻訳ファイル
    │   ├── pages/            # ルーターページ
    │   ├── utils/            # APIリクエストなどのツール
    │   ├── App.tsx           # ルートルーター
    │   └── main.tsx          # Reactマウントポイント
    └── package.json
```

### リクエストの流れ

1. 被験者がフロントエンドのリンク `http://localhost:5173/` にアクセスする。
2. フロントエンドから `fetch` でバックエンドAPI `http://localhost:3000/api/...` を叩く。
3. バックエンドのルート（`asyncHandler` でエラー処理を統合）がリクエストを受け取る。
4. Prisma Client が SQLite (`dev.db`) から音声データとスケール設定を取得する。
5. フロントエンドの `MetricRenderer` が設定に応じた評価UIを描画する。
6. ユーザーが回答を送信し、Prismaが `Response` テーブルに保存する。

### コア設計

**エラー処理の統合 (`backend/src/utils/asyncHandler.ts`)**
- すべてのExpressルートを `asyncHandler` でラップしています。これにより、`try/catch` を各所に書く必要がなくなり、エラーを一括で処理できます。

**評価UIの描画 (`frontend/src/pages/Subject.tsx`)**
- `MetricRenderer` がデータベースの `ScaleMetric` 設定を解析し、セマンティックディファレンシャルや通常のスライダーUIを動的に構築します。

**ローカル保存 (`backend/src/index.ts` / multer)**
- 管理者がアップロードした音声ファイルは `backend/uploads/` に保存され、静的ルーティングで配信されます。ディレクトリトラバーサルを防ぐため `path.basename` をかませています。

### データベーススキーマ

```
Admin
├── id (Int, PK)
├── username (String, Unique)
└── password (String, Hashed)

Question (設問)
├── id (Int, PK)
├── type (String)              # 評価タイプ (例: AUDIO_AB)
├── audioUrlA / B / C (String) # 音声ファイルのリンク
├── metricGroup (String)       # 紐づくスケールグループ
└── ...

ScaleMetric (評価スケール)
├── id (Int, PK)
├── group (String)             # グループ名
├── type (String)              # basic | semantic_diff
├── points (Int)               # 段階数 (例: 7段階)
└── leftLabel / rightLabel     # 左右のラベル (例: Warm - Cold)

Response (回答)
├── id (Int, PK)
├── sessionId (String)         # セッションID
├── questionId (Int, FK)       # 紐づく設問
├── choice (String)            # JSON形式の回答データ
└── createdAt (DateTime)
```

## スクリプト一覧

### バックエンド (`/backend`)

| コマンド | 説明 |
|---|---|
| `npm run dev` | ホットリロード対応の開発サーバーを起動 (`tsx watch`) |
| `npm start` | 本番モードでサーバーを起動 |
| `npx prisma studio` | ブラウザ版のSQLite管理画面を開く |

### フロントエンド (`/frontend`)

| コマンド | 説明 |
|---|---|
| `npm run dev` | Viteサーバーを起動 |
| `npm run build` | TypeScriptのチェック (`tsc -b`) とビルドを実行 |
| `npm run lint` | ESLintを実行 |
| `npm run preview` | `dist` ディレクトリの本番ビルドをプレビュー |

## デプロイ

### フロントエンド (Vercel / Netlify / Nginx)

1. `frontend` フォルダでビルドします：
   ```bash
   npm run build
   ```
2. 生成された `dist/` フォルダをホスティングサービス（Vercel, Netlify）や Nginx 環境に配置します。
3. **注意**: ビルド前に、フロントエンドからのAPIリクエスト先が本番のバックエンドURLになるように設定してください（例: Viteの `.env.production` を使う）。

### バックエンド (VPS / Docker)

**VPS の場合 (PM2 を推奨)**:
1. サーバーにコードを配置します。
2. `npm install` で依存関係をインストールします。
3. `npx prisma db push` でデータベースを同期します。
4. PM2で起動します：
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name "audiosurvey-backend"
   ```

**Docker の場合**:
SQLite とローカルファイル保存を使っているため、Docker で動かす場合は以下の点に注意してください。
1. **データボリュームのマウント**：コンテナ再起動でデータが消えないよう、`backend/prisma/dev.db` と `backend/uploads/` をマウントしてください。
2. バックエンドのポートを公開し、Nginx等でリバースプロキシを設定します。

## トラブルシューティング

### ログインできない
**エラー**: 管理者画面で Unauthorized になる。
**解決策**: `backend/.env` に `JWT_SECRET` があるか確認してください。なければ `.env.example` からコピーしてバックエンドを再起動します。

### 音声が再生されない
**エラー**: 評価画面で音声ファイルが 404 Not Found になる。
**解決策**: `backend/uploads/` フォルダに該当のファイルが存在するか確認してください。また、バックエンドの `express.static` が正しく `/uploads` にルーティングされているか確認します。

### Prisma のエラー
**エラー**: `The table main.Question does not exist in the current database.`
**解決策**: データベースのテーブルが作成されていません。`backend` フォルダで以下を実行してください：
```bash
npx prisma db push
```

## 新しい言語の追加方法

システムは言語パックの自動読み込みと、データベーステキストの動的解析をサポートしています。新しい言語（例：韓国語 `ko`）を追加するには、以下の3つのステップを実行します。

1. **言語辞書の作成**:
   `frontend/src/locales/en.ts` をコピーして `frontend/src/locales/ko.ts` を作成し、値を翻訳します。Vite によって自動的に読み込まれます。

2. **UIボタンの追加**:
   `frontend/src/App.tsx` の言語切り替えメニューにボタンを追加します。
   ```tsx
   <button className="pixel-btn secondary" onClick={() => { changeLanguage('ko'); setMobileMenuOpen(false); }}>한국어</button>
   ```

3. **データベーステキスト解析の更新**:
   `frontend/src/utils/i18nUtils.ts` に、新しい言語のインデックス（例：4番目の言語ならインデックス3）を追加します。
   ```typescript
   if (lang.startsWith('ko')) return parts[3] || parts[0];
   ```
   *その後、管理画面で多言語テキストを入力する際は、`中文|English|日本語|한국어` のフォーマットを使用します。*

## ライセンス

本プロジェクトは GNU General Public License v3.0 に基づいて公開されています。詳細は [LICENSE](LICENSE) ファイルをご確認ください。

