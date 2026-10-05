# Quaeligo

[English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md)

Quaeligo is an open-source web app for running subjective listening tests. Use it to blind-test audio algorithms such as speech enhancement, noise suppression, or spatial audio. You set up the questionnaires and rating scales, and export the responses when the test is done.

The name combines the Latin *quaero* (to inquire) and *colligo* (to collect).

## Features

- A/B blind listening tests and audio quality ratings (MOS, MUSHRA)
- Per-question rating scales, including basic scores and semantic differential sliders
- Multiple surveys, each with its own questions, scales, and responses
- An admin panel for creating questions, uploading audio, editing scales, and exporting responses
- UI in Chinese, English, and Japanese (i18next)

## Tech stack

- TypeScript on both frontend and backend
- Frontend: React 19, Vite, React Router, i18next
- Backend: Express 5 on Node.js, run with tsx
- Database: SQLite with Prisma ORM
- File uploads: multer, stored on the local disk
- Auth: JWT, bcryptjs, express-rate-limit

## Requirements

- Node.js 20 or later
- npm

SQLite is file-based, so you don't need a separate database server.

## Quick start

Run these from the project root:

```bash
git clone <your-repository-url>
cd quaeligo

# Install root, backend, and frontend dependencies
npm install
npm run install:all

# First run only: create .env, the database, and the default admin
cd backend
cp .env.example .env
npx prisma db push
npx prisma db seed   # creates admin / admin123
cd ..

# Start backend and frontend together
npm run dev
```

The backend listens on `http://localhost:3000`. Open the app at `http://localhost:5173`. The Vite dev server proxies `/api` and `/uploads` to the backend.

## Manual setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

The defaults in `.env.example` are fine for local development.

| Variable | Description | Default in `.env.example` |
|---|---|---|
| `PORT` | Port the backend listens on | `3000` |
| `JWT_SECRET` | Secret used to sign admin login tokens | `your_jwt_secret_here` |
| `DATABASE_URL` | SQLite connection string, relative to `backend/prisma/` | `file:./quaeligo.db?connection_limit=1&busy_timeout=5000` |
| `CORS_ORIGIN` | Allowed origins, comma-separated | `http://localhost:5173,http://localhost:3000` |

If `CORS_ORIGIN` is not set during development, the backend allows `http://localhost:5173` and `http://localhost:3000`. With Docker Compose, Nginx serves the frontend and backend from the same origin, so you usually don't need to set it.

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Scripts

Root:

| Command | Description |
|---|---|
| `npm run install:all` | Install backend and frontend dependencies |
| `npm run dev` | Start backend and frontend together (concurrently) |

Backend (`backend/`):

| Command | Description |
|---|---|
| `npm run dev` | Start the server with `tsx watch` (reloads on change) |
| `npm start` | Start the server with `tsx` (no watch) |
| `npm test` | Run the tests in `test/` |
| `npx prisma db seed` | Create the default admin account |
| `npx prisma studio` | Browse the database in the browser |

Frontend (`frontend/`):

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## Deployment

The frontend calls the API with relative paths (`/api/...`, `/uploads/...`), so it must be served from the same origin as the backend.

### Docker Compose

```bash
docker compose up -d --build
```

The app is then available on port 80. Nginx in the frontend container serves the built files and proxies `/api` and `/uploads` to the backend container. On startup, the backend runs `prisma db push` and creates the default admin account.

Data is kept in two mounted directories:

- `./backend/prisma`: the SQLite database (`quaeligo.db`)
- `./uploads`: uploaded audio files

Before deploying, replace the `JWT_SECRET` in `docker-compose.yml`. After your first login, change the default `admin / admin123` password.

### Without Docker (PM2)

1. Build the frontend: `cd frontend && npm install && npm run build`.
2. Set up the backend: `cd backend && npm install && npx prisma db push && npx prisma db seed`.
3. Start the backend with PM2:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start "npm start" --name quaeligo-backend
   ```

The backend serves `frontend/dist` directly, so the whole app runs on one port (`3000` by default). You can put Nginx or another reverse proxy in front of it.

## Troubleshooting

### Admin login fails with Unauthorized

Check that `JWT_SECRET` is set in `backend/.env`, then restart the backend. If you haven't created the admin account yet, run `npx prisma db seed`.

### Audio returns 404 on the subject page

Uploaded files are stored in `uploads/` at the project root, not in `backend/`. Make sure the files are there. During development, also check that the Vite dev server is running, since it proxies `/uploads`.

### `The table main.Question does not exist in the current database.`

The database schema hasn't been created. Run this in `backend/`:

```bash
npx prisma db push
```

## Adding a language

The example below adds Korean (`ko`).

1. Copy `frontend/src/locales/en.ts` to `frontend/src/locales/ko.ts` and translate the values. `frontend/src/i18n.ts` picks up every file in `locales/` automatically.

2. Add a switcher button in `frontend/src/App.tsx`:
   ```tsx
   <button className="pixel-btn secondary" onClick={() => { changeLanguage('ko'); setMobileMenuOpen(false); }}>한국어</button>
   ```

3. Text stored in the database (question titles, scale labels, and so on) uses `|` to separate languages. Add the new language's position in `frontend/src/utils/i18nUtils.ts`:
   ```typescript
   if (lang.startsWith('ko')) return parts[3] || parts[0];
   ```
   Then enter text in the admin panel as `中文|English|日本語|한국어`.

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).
