# Quaeligo

[English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md)

Quaeligo は、主観的な聴取実験を行うためのオープンソースの Web アプリです。音声強調、ノイズ抑制、空間音響などの音声アルゴリズムをブラインドで評価できます。アンケートと評価尺度は自由に設定でき、実験後は回答データをエクスポートできます。

名前はラテン語の *quaero*（探求する）と *colligo*（集める）に由来します。

## 機能

- A/B ブラインド聴取テストと音質評価（MOS、MUSHRA）
- 設問ごとの評価尺度（基本スコア、SD 法スライダー）
- 複数アンケートの管理（設問・尺度・回答はアンケートごとに独立）
- 管理画面：設問の作成、音声のアップロード、尺度の編集、回答のエクスポート
- 日本語・英語・中国語の UI（i18next）

## 技術スタック

- フロントエンド・バックエンドとも TypeScript
- フロントエンド：React 19、Vite、React Router、i18next
- バックエンド：Express 5（Node.js、tsx で実行）
- データベース：SQLite + Prisma ORM
- ファイルアップロード：multer（ローカルディスクに保存）
- 認証：JWT、bcryptjs、express-rate-limit

## 動作環境

- Node.js 20 以上
- npm

SQLite はファイルベースなので、別途データベースサーバーは不要です。

## クイックスタート

プロジェクトのルートで実行します。

```bash
git clone <your-repository-url>
cd quaeligo

# ルート・バックエンド・フロントエンドの依存関係をインストール
npm install
npm run install:all

# 初回のみ：.env、データベース、初期管理者を作成
cd backend
cp .env.example .env
npx prisma db push
npx prisma db seed   # admin / admin123 を作成
cd ..

# バックエンドとフロントエンドを同時に起動
npm run dev
```

バックエンドは `http://localhost:3000` で待ち受けます。ブラウザで `http://localhost:5173` を開いてください。Vite の開発サーバーが `/api` と `/uploads` をバックエンドに転送します。

## 手動セットアップ

### バックエンド

```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

ローカル開発では `.env.example` の値をそのまま使えます。

| 変数 | 説明 | `.env.example` の値 |
|---|---|---|
| `PORT` | バックエンドのポート | `3000` |
| `JWT_SECRET` | 管理者ログイン用トークンの署名鍵 | `your_jwt_secret_here` |
| `DATABASE_URL` | SQLite の接続文字列（`backend/prisma/` からの相対パス） | `file:./quaeligo.db?connection_limit=1&busy_timeout=5000` |
| `CORS_ORIGIN` | 許可するオリジン（カンマ区切り） | `http://localhost:5173,http://localhost:3000` |

開発時に `CORS_ORIGIN` を設定しない場合、`http://localhost:5173` と `http://localhost:3000` が許可されます。Docker Compose では Nginx がフロントエンドとバックエンドを同一オリジンで配信するため、通常は設定不要です。

### フロントエンド

別のターミナルで実行します。

```bash
cd frontend
npm install
npm run dev
```

## スクリプト

ルート：

| コマンド | 説明 |
|---|---|
| `npm run install:all` | バックエンドとフロントエンドの依存関係をインストール |
| `npm run dev` | バックエンドとフロントエンドを同時に起動（concurrently） |

バックエンド（`backend/`）：

| コマンド | 説明 |
|---|---|
| `npm run dev` | `tsx watch` で起動（変更時に自動再起動） |
| `npm start` | `tsx` で起動（ファイル監視なし） |
| `npm test` | `test/` のテストを実行 |
| `npx prisma db seed` | 初期管理者アカウントを作成 |
| `npx prisma studio` | ブラウザでデータベースを閲覧 |

フロントエンド（`frontend/`）：

| コマンド | 説明 |
|---|---|
| `npm run dev` | Vite 開発サーバーを起動 |
| `npm run build` | 型チェック（`tsc -b`）後、`dist/` にビルド |
| `npm run lint` | ESLint を実行 |
| `npm run preview` | ビルド結果をプレビュー |

## デプロイ

フロントエンドは相対パス（`/api/...`、`/uploads/...`）で API を呼び出すため、バックエンドと同一オリジンで配信する必要があります。

### Docker Compose

```bash
docker compose up -d --build
```

起動後はポート 80 でアクセスできます。フロントエンドコンテナの Nginx がビルド済みファイルを配信し、`/api` と `/uploads` をバックエンドコンテナに転送します。バックエンドは起動時に `prisma db push` を実行し、初期管理者を作成します。

データは次の 2 つのマウントディレクトリに保存されます。

- `./backend/prisma`：SQLite データベース（`quaeligo.db`）
- `./uploads`：アップロードされた音声ファイル

デプロイ前に `docker-compose.yml` の `JWT_SECRET` を変更してください。初回ログイン後は、初期パスワード `admin / admin123` を変更してください。

### Docker を使わない場合（PM2）

1. フロントエンドをビルド：`cd frontend && npm install && npm run build`
2. バックエンドを準備：`cd backend && npm install && npx prisma db push && npx prisma db seed`
3. PM2 でバックエンドを起動：
   ```bash
   npm install -g pm2
   cd backend
   pm2 start "npm start" --name quaeligo-backend
   ```

バックエンドが `frontend/dist` をそのまま配信するので、アプリ全体が 1 つのポート（既定は `3000`）で動きます。必要に応じて Nginx などのリバースプロキシを前段に置いてください。

## トラブルシューティング

### 管理者ログインで Unauthorized になる

`backend/.env` に `JWT_SECRET` が設定されているか確認し、バックエンドを再起動してください。管理者アカウントを未作成の場合は `npx prisma db seed` を実行してください。

### 回答画面で音声が 404 になる

アップロードしたファイルは `backend/` ではなく、プロジェクトルートの `uploads/` に保存されます。ファイルがそこにあるか確認してください。開発時は Vite が `/uploads` を転送するので、Vite の開発サーバーが起動しているかも確認してください。

### `The table main.Question does not exist in the current database.`

データベースのテーブルが作成されていません。`backend/` で次を実行してください。

```bash
npx prisma db push
```

## 言語の追加

韓国語（`ko`）を追加する例です。

1. `frontend/src/locales/en.ts` を `frontend/src/locales/ko.ts` にコピーし、値を翻訳します。`frontend/src/i18n.ts` が `locales/` 内のファイルを自動で読み込みます。

2. `frontend/src/App.tsx` に切り替えボタンを追加します。
   ```tsx
   <button className="pixel-btn secondary" onClick={() => { changeLanguage('ko'); setMobileMenuOpen(false); }}>한국어</button>
   ```

3. データベース内のテキスト（設問タイトル、尺度ラベルなど）は `|` で言語を区切っています。`frontend/src/utils/i18nUtils.ts` に新しい言語の位置を追加します。
   ```typescript
   if (lang.startsWith('ko')) return parts[3] || parts[0];
   ```
   以降、管理画面では `中文|English|日本語|한국어` の形式で入力します。

## ライセンス

GNU General Public License v3.0。詳しくは [LICENSE](LICENSE) をご覧ください。
