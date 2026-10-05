# Quaeligo

[English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md)

Quaeligo 是一个开源的 Web 主观听音测试系统，可用于对语音增强、降噪、空间音频等音频算法做盲测。问卷和评分量表都可以自行配置，测试结束后可导出答题数据。

名字取自拉丁语 *quaero*（探究）和 *colligo*（收集）。

## 功能

- A/B 盲听测试和音质评分（MOS、MUSHRA）
- 每道题可单独设置评分量表，支持基础打分和语义差异滑块
- 支持多个问卷，各自拥有独立的题目、量表和答题记录
- 管理后台：创建题目、上传音频、修改量表、导出答题数据
- 界面支持中文、英文、日文（i18next）

## 技术栈

- 前后端均使用 TypeScript
- 前端：React 19、Vite、React Router、i18next
- 后端：Express 5（Node.js，通过 tsx 运行）
- 数据库：SQLite + Prisma ORM
- 文件上传：multer，保存在本地磁盘
- 认证：JWT、bcryptjs、express-rate-limit

## 环境要求

- Node.js 20 及以上
- npm

SQLite 以文件形式存储，不需要另外安装数据库服务。

## 快速开始

在项目根目录执行：

```bash
git clone <your-repository-url>
cd quaeligo

# 安装根目录、后端、前端的依赖
npm install
npm run install:all

# 仅首次：创建 .env、数据库和默认管理员
cd backend
cp .env.example .env
npx prisma db push
npx prisma db seed   # 创建 admin / admin123
cd ..

# 同时启动后端和前端
npm run dev
```

后端监听 `http://localhost:3000`，在浏览器打开 `http://localhost:5173` 即可使用。Vite 开发服务器会把 `/api` 和 `/uploads` 转发到后端。

## 手动启动

### 后端

```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

本地开发直接用 `.env.example` 的默认值即可。

| 变量 | 说明 | `.env.example` 中的默认值 |
|---|---|---|
| `PORT` | 后端监听端口 | `3000` |
| `JWT_SECRET` | 管理员登录令牌的签名密钥 | `your_jwt_secret_here` |
| `DATABASE_URL` | SQLite 连接字符串（路径相对于 `backend/prisma/`） | `file:./quaeligo.db?connection_limit=1&busy_timeout=5000` |
| `CORS_ORIGIN` | 允许的来源，逗号分隔 | `http://localhost:5173,http://localhost:3000` |

开发环境下如果没有设置 `CORS_ORIGIN`，后端默认允许 `http://localhost:5173` 和 `http://localhost:3000`。使用 Docker Compose 时，前后端由 Nginx 在同一个源下提供，一般不需要设置。

### 前端

另开一个终端：

```bash
cd frontend
npm install
npm run dev
```

## 脚本

根目录：

| 命令 | 说明 |
|---|---|
| `npm run install:all` | 安装后端和前端的依赖 |
| `npm run dev` | 同时启动后端和前端（concurrently） |

后端（`backend/`）：

| 命令 | 说明 |
|---|---|
| `npm run dev` | 用 `tsx watch` 启动，修改代码后自动重启 |
| `npm start` | 用 `tsx` 启动（不监听文件变化） |
| `npm test` | 运行 `test/` 下的测试 |
| `npx prisma db seed` | 创建默认管理员账号 |
| `npx prisma studio` | 在浏览器中查看数据库 |

前端（`frontend/`）：

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 类型检查（`tsc -b`）并构建到 `dist/` |
| `npm run lint` | 运行 ESLint |
| `npm run preview` | 预览构建结果 |

## 部署

前端用相对路径（`/api/...`、`/uploads/...`）请求接口，因此必须和后端部署在同一个源下。

### Docker Compose

```bash
docker compose up -d --build
```

启动后通过 80 端口访问。前端容器里的 Nginx 负责提供构建好的页面，并把 `/api` 和 `/uploads` 转发给后端容器。后端启动时会自动执行 `prisma db push` 并创建默认管理员。

数据保存在两个挂载目录中：

- `./backend/prisma`：SQLite 数据库（`quaeligo.db`）
- `./uploads`：上传的音频文件

部署前请替换 `docker-compose.yml` 里的 `JWT_SECRET`，首次登录后请修改默认密码 `admin / admin123`。

### 不用 Docker（PM2）

1. 构建前端：`cd frontend && npm install && npm run build`
2. 准备后端：`cd backend && npm install && npx prisma db push && npx prisma db seed`
3. 用 PM2 启动后端：
   ```bash
   npm install -g pm2
   cd backend
   pm2 start "npm start" --name quaeligo-backend
   ```

后端会直接提供 `frontend/dist`，整个应用只占用一个端口（默认 `3000`），前面可以再加一层 Nginx 等反向代理。

## 常见问题

### 管理员登录提示 Unauthorized

检查 `backend/.env` 中是否设置了 `JWT_SECRET`，然后重启后端。如果还没有创建管理员账号，先运行 `npx prisma db seed`。

### 答题页面音频 404

上传的文件保存在项目根目录的 `uploads/`，不在 `backend/` 下，请确认文件确实在这个目录里。开发时 `/uploads` 由 Vite 转发，还要确认 Vite 开发服务器在运行。

### `The table main.Question does not exist in the current database.`

数据库表还没有创建。在 `backend/` 下执行：

```bash
npx prisma db push
```

## 添加新语言

以韩语（`ko`）为例：

1. 把 `frontend/src/locales/en.ts` 复制为 `frontend/src/locales/ko.ts`，翻译其中的值。`frontend/src/i18n.ts` 会自动加载 `locales/` 下的所有文件。

2. 在 `frontend/src/App.tsx` 中添加切换按钮：
   ```tsx
   <button className="pixel-btn secondary" onClick={() => { changeLanguage('ko'); setMobileMenuOpen(false); }}>한국어</button>
   ```

3. 数据库里的文本（题目标题、量表标签等）用 `|` 分隔各语言。在 `frontend/src/utils/i18nUtils.ts` 中加上新语言对应的位置：
   ```typescript
   if (lang.startsWith('ko')) return parts[3] || parts[0];
   ```
   之后在管理后台按 `中文|English|日本語|한국어` 的格式填写文本。

## 许可证

GNU General Public License v3.0，详见 [LICENSE](LICENSE)。
