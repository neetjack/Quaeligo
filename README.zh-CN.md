# Quaeligo

[English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md)

Quaeligo（源自拉丁语 *Quaero* [探索/设问] + *Colligo* [收集/评鉴]）是一个用于音频主观评测与听觉实验的现代化开源网页系统。它主要用来给音频算法（如语音增强、降噪、空间音频、音质评定）进行主观测试和盲听测试，支持自定义试题、多维滑动评分指标以及一键数据导出。

## 核心功能

- **多维音频试题**：支持盲听（A/B Test）、音质评价（MOS/MUSHRA）等常见测试类型。
- **自定义指标渲染**：可以在题目下方配置不同的滑动评分组件（语义差异 Semantic Diff、基础打分等）。
- **多语言支持 (i18n)**：前端内置了多语言切换功能。
- **管理后台**：管理员可以创建试题、上传音频文件、修改量表并导出收集到的答题数据。

## 技术栈

- **语言**: TypeScript (全栈)
- **前端**: React 19, Vite, React Router, i18next
- **后端**: Express 5, Node.js (tsx)
- **数据库**: SQLite, Prisma ORM
- **文件存储**: 本地文件系统 (使用 multer 上传)
- **安全与认证**: JWT (JSON Web Tokens), bcryptjs, express-rate-limit

## 环境要求

- **Node.js**: 20 或更高版本
- **npm** (推荐) 或 yarn
- *注：项目直接使用 SQLite，本地跑起来不需要额外部署数据库服务。*

## 快速开始

### ⚡ 一键启动

根目录配置了脚本，所以不需要分别进入前后端文件夹，在**项目根目录**执行以下命令即可：

```bash
# 1. 克隆代码
git clone <your-repository-url>
cd quaeligo

# 2. 一键安装前后端所有依赖
npm run install:all

# 3. 环境变量与数据库初始化 (仅首次需要)
cd backend
cp .env.example .env
npx prisma db push
npm run prisma:seed   # 初始化默认管理员账号 (admin / admin123)
cd ..

# 4. 一键同时启动前后端开发服务器
npm run dev
```
此时后端 API 跑在 `http://localhost:3000`，前端界面跑在 `http://localhost:5173`。

---

### 分步手动启动

#### 后端启动

```bash
cd backend
npm install
```

**配置环境变量**：
复制示例文件：
```bash
cp .env.example .env
```
修改 `.env`（本地开发用默认的端口和 `JWT_SECRET` 就可以）：

| 变量 | 说明 | 示例 |
|---|---|---|
| `PORT` | 后端监听端口 | `3000` |
| `JWT_SECRET` | JWT 加密密钥 | `your_jwt_secret_key_here` |
| `DATABASE_URL` | SQLite 数据库连接串 | `file:./audiosurvey.db?connection_limit=1&busy_timeout=5000` |
| `CORS_ORIGIN` | 允许的跨域来源域名列表（逗号分隔） | `http://localhost:5173,https://survey.example.com` |

> **CORS 跨域配置指南 (`CORS_ORIGIN`)**：
> - **本地开发**：未设置时默认放行 `http://localhost:5173,http://localhost:3000`。
> - **生产环境上线**：填入正式域名（支持多个，逗号分隔），例如 `https://survey.yourdomain.com`。
> - **Nginx 反代架构**：若使用项目内置的 `docker-compose.yml`，前端与 `/api/` 统一由 Nginx 80 端口分发，浏览器请求天然属于同源，安全且无需复杂配置。

**初始化数据库**：
```bash
# 同步 Prisma 表结构
npx prisma db push
```

**启动服务**：
```bash
npm run dev
```

#### 前端启动

开一个新终端：

```bash
cd frontend
npm install
```

**启动 Vite**：
```bash
npm run dev
```

## 架构

### 目录结构

```
├── backend/                  # Express 5 后端
│   ├── prisma/               # Prisma schema 与 SQLite 数据库
│   │   ├── dev.db            # SQLite 数据库文件
│   │   └── schema.prisma     # 数据模型定义
│   ├── src/                  # 后端源码
│   │   ├── controllers/      # 控制器逻辑
│   │   ├── middleware/       # JWT 鉴权、限流中间件
│   │   ├── utils/            # 工具函数 (asyncHandler, 密码哈希)
│   │   └── index.ts          # Express 入口
│   ├── uploads/              # 上传的音频文件存放处
│   └── package.json
└── frontend/                 # Vite + React 前端
    ├── src/                  # 前端源码
    │   ├── components/       # 通用 UI 和图表组件
    │   ├── locales/          # i18next 翻译文件
    │   ├── pages/            # 路由页面
    │   ├── utils/            # API 请求和工具
    │   ├── App.tsx           # 根路由
    │   └── main.tsx          # React 挂载入口
    └── package.json
```

### 请求链路

1. 受试者打开前端链接 `http://localhost:5173/`。
2. 前端通过 `fetch` 请求后端 API `http://localhost:3000/api/...`。
3. 后端路由（被 `asyncHandler` 包装拦截错误）收到请求。
4. Prisma Client 去 SQLite (`dev.db`) 里查出音频题目和量表配置。
5. 前端的 `MetricRenderer` 根据配置渲染出对应的打分 UI。
6. 用户提交，前端发 POST 请求，Prisma 存入 `Response` 表。

### 核心设计

**统一的异步处理 (`backend/src/utils/asyncHandler.ts`)**
- 所有 Express 路由都包了一层 `asyncHandler`。这省掉了到处写 `try/catch` 的麻烦，遇到错误统一抛出。

**量表渲染 (`frontend/src/pages/Subject.tsx`)**
- 这里的 `MetricRenderer` 负责解析数据库里存的 `ScaleMetric` 结构，动态渲染出语义差异（Semantic Diff）或者普通打分条的 UI。

**本地存储 (`backend/src/index.ts` / multer)**
- 管理员上传的音频存在 `backend/uploads/` 里，通过静态路由给前端播放。代码里用 `path.basename` 做了限制，防止目录遍历攻击。

### 数据库 Schema

```
Admin
├── id (Int, PK)
├── username (String, Unique)
└── password (String, Hashed)

Question (试题)
├── id (Int, PK)
├── type (String)              # 测评类型 (例如 AUDIO_AB)
├── audioUrlA / B / C (String) # 音频文件链接
├── metricGroup (String)       # 绑定的量表组
└── ...

ScaleMetric (评分量表)
├── id (Int, PK)
├── group (String)             # 量表组名
├── type (String)              # basic | semantic_diff
├── points (Int)               # 评分阶数 (例如 7分制)
└── leftLabel / rightLabel     # 左右两端词汇 (例如 Warm - Cold)

Response (受试者回答)
├── id (Int, PK)
├── sessionId (String)         # 会话追踪 ID
├── questionId (Int, FK)       # 关联题目
├── choice (String)            # 存成 JSON 字符串的打分结果
└── createdAt (DateTime)
```

## 可用脚本

### 后端 (`/backend`)

| 命令 | 说明 |
|---|---|
| `npm run dev` | 用 `tsx watch` 启动后端，带热更新 |
| `npm start` | 生产模式启动后端 |
| `npx prisma studio` | 启动浏览器版的 SQLite 数据库管理面板 |

### 前端 (`/frontend`)

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动 Vite |
| `npm run build` | 跑 TypeScript 检查 (`tsc -b`) 并打包静态文件 |
| `npm run lint` | 跑 ESLint |
| `npm run preview` | 预览 `dist` 目录打包好的产物 |

## 部署

### 前端部署 (Vercel / Netlify / Nginx)

1. 在 `frontend` 目录运行：
   ```bash
   npm run build
   ```
2. 把生成的 `dist/` 文件夹放到任意静态托管平台（比如 Vercel, Netlify）或 Nginx 下。
3. **注意**：构建前要确认前端 API 请求路径对准了线上后端的地址（可以通过 Vite 的 `.env.production` 来配）。

### 后端部署 (VPS / Docker)

**VPS 部署 (推荐用 PM2)**：
1. 把代码拷到服务器。
2. 安装依赖 `npm install`。
3. 同步数据库 `npx prisma db push`。
4. 用 PM2 跑起来：
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name "audiosurvey-backend"
   ```

**Docker 部署注意点**：
因为用了 SQLite 和本地存储，如果用 Docker：
1. **一定要挂载数据卷**，把 `backend/prisma/dev.db` 和 `backend/uploads/` 映射出来，不然容器重启数据就没了。
2. 把后端端口暴露出来，配个 Nginx 反代。

## 常见问题

### JWT 登录失败
**报错**：管理员登录提示 Unauthorized。
**解决**：看下 `backend/.env` 里有没有配 `JWT_SECRET`。如果没有，照着 `.env.example` 抄一份进去，重启后端。

### 前端放不出音频
**报错**：Subject 界面音频 404 Not Found。
**解决**：去 `backend/uploads/` 目录下看下文件在不在。另外确认下后端的 `express.static` 有没有正确把 `/uploads` 路由映射出去。

### Prisma 报错
**报错**：`The table main.Question does not exist in the current database.`
**解决**：数据库表没建好。进 `backend` 目录跑一下：
```bash
npx prisma db push
```

## 如何添加新语言

系统支持语言包自动加载与数据库文本的动态解析。如果需要添加新语言（如韩语 `ko`），只需三步：

1. **创建语言字典**：
   将 `frontend/src/locales/en.ts` 复制一份命名为 `frontend/src/locales/ko.ts`，并翻译对应的值。Vite 会自动加载新语言包。

2. **添加切换按钮**：
   在 `frontend/src/App.tsx` 中的语言下拉菜单中添加按钮：
   ```tsx
   <button className="pixel-btn secondary" onClick={() => { changeLanguage('ko'); setMobileMenuOpen(false); }}>한국어</button>
   ```

3. **更新数据库文本解析器**：
   在 `frontend/src/utils/i18nUtils.ts` 中，为新语言增加一行解析逻辑（比如第四门语言对应索引 3）：
   ```typescript
   if (lang.startsWith('ko')) return parts[3] || parts[0];
   ```
   *此后，在后台填写多语言文本时，格式应为：`中文|English|日本語|한국어`。*

## 开源协议

本项目基于 GNU General Public License v3.0 协议开源 - 详情请参阅 [LICENSE](LICENSE) 文件。

