# Quaeligo

[English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md)

Quaeligo (derived from Latin *Quaero* [to explore/inquire] + *Colligo* [to collect/assess]) is an open-source, web-based audio evaluation system. It is built for subjective listening experiments and blind evaluation of audio algorithms (such as speech enhancement, noise suppression, or spatial audio). It supports custom questionnaire configurations, multi-dimensional scoring metrics, and one-click data export.

## Key features

- **Multi-dimensional audio testing**: Supports blind listening (A/B Test) and audio quality evaluation (MOS/MUSHRA).
- **Custom metric rendering**: Configure different sliding scoring components (Semantic Diff, basic scoring) for each question.
- **Multi-language support (i18n)**: The frontend includes built-in localization.
- **Admin dashboard**: Create questions, upload audio files, modify scales, and export subject data.

## Tech stack

- **Language**: TypeScript (Full-stack)
- **Frontend**: React 19, Vite, React Router, i18next
- **Backend**: Express 5, Node.js (tsx)
- **Database**: SQLite, Prisma ORM
- **File storage**: Local file system (via multer)
- **Security & auth**: JWT (JSON Web Tokens), bcryptjs, express-rate-limit

## Prerequisites

- **Node.js**: Version 20 or higher
- **npm** (recommended) or yarn
- *Note: This project uses SQLite, so it runs directly on your local machine without needing an external database service.*

## Getting started

### ⚡ Quick start (one-click)

We've added root directory scripts so you don't need to manually navigate into the frontend and backend folders. Run these commands from the **project root**:

```bash
# 1. Clone the repository
git clone <your-repository-url>
cd quaeligo

# 2. Install dependencies for both frontend and backend
npm run install:all

# 3. Environment variables & database initialization (first time only)
cd backend
cp .env.example .env
npx prisma db push
npm run prisma:seed   # Creates default admin (admin / admin123)
cd ..

# 4. Start frontend and backend development servers together
npm run dev
```
The backend API will run at `http://localhost:3000`, and the frontend application at `http://localhost:5173`.

---

### Step-by-step manual setup

#### Backend setup

```bash
cd backend
npm install
```

**Environment variables**:
Copy the example file to `.env`:
```bash
cp .env.example .env
```
Update `.env` if needed (the default `JWT_SECRET` and port work fine for local development):

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend service listening port | `3000` |
| `JWT_SECRET` | JWT encryption key | `your_jwt_secret_key_here` |
| `DATABASE_URL` | SQLite database connection string | `file:./audiosurvey.db?connection_limit=1&busy_timeout=5000` |
| `CORS_ORIGIN` | Allowed cross-origin domains (comma-separated) | `http://localhost:5173,https://survey.example.com` |

> **CORS Configuration Guide (`CORS_ORIGIN`)**:
> - **Local Development**: If unspecified, defaults to `http://localhost:5173,http://localhost:3000`.
> - **Production Deployment**: Set comma-separated allowed origins (e.g., `https://survey.yourdomain.com`).
> - **Nginx Reverse Proxy**: When using the included `docker-compose.yml`, frontend and backend are served behind the same Nginx port, ensuring same-origin communication.

**Database initialization**:
```bash
# Sync Prisma schema
npx prisma db push
```

**Start the development server**:
```bash
npm run dev
```

#### Frontend setup

Open a new terminal window:

```bash
cd frontend
npm install
```

**Start the Vite development server**:
```bash
npm run dev
```

## Architecture

### Directory structure

```
├── backend/                  # Express 5 backend application
│   ├── prisma/               # Prisma schema and SQLite database
│   │   ├── dev.db            # SQLite database file (auto-generated)
│   │   └── schema.prisma     # Data model definitions
│   ├── src/                  # Backend source code
│   │   ├── controllers/      # Business logic controllers (Admin, API, etc.)
│   │   ├── middleware/       # JWT auth and rate limiting
│   │   ├── utils/            # Utilities (asyncHandler, password hashing)
│   │   └── index.ts          # Express application entry point
│   ├── uploads/              # Uploaded audio files
│   └── package.json
└── frontend/                 # Vite + React frontend application
    ├── src/                  # Frontend source code
    │   ├── components/       # Common UI and chart components
    │   ├── locales/          # i18next localization files
    │   ├── pages/            # Router pages (Admin, Subject evaluation views)
    │   ├── utils/            # API requests and helper functions
    │   ├── App.tsx           # Root router
    │   └── main.tsx          # React mount point
    └── package.json
```

### Request lifecycle

1. A subject opens the evaluation link `http://localhost:5173/`.
2. The frontend uses `fetch` to call the Express API at `http://localhost:3000/api/...`.
3. The backend route (wrapped by `asyncHandler`) receives the request.
4. Prisma Client queries the `dev.db` database for audio questions and scales.
5. The frontend `MetricRenderer` builds the scale UI.
6. The user submits answers, the frontend sends a POST request, and Prisma saves the `Response`.

### Key components

**Unified async error handling (`backend/src/utils/asyncHandler.ts`)**
- All Express routes are wrapped in `asyncHandler`. This removes `try/catch` boilerplate and catches asynchronous errors cleanly.

**Scale rendering system (`frontend/src/pages/Subject.tsx`)**
- The main component for audio evaluation. The `MetricRenderer` parses the `ScaleMetric` structure from the database to build UIs for semantic differential or basic scoring.

**Local file storage (`backend/src/index.ts` / multer)**
- Audio files uploaded by admins go into `backend/uploads/`. Static routing serves them to the frontend, using `path.basename` to prevent directory traversal attacks.

### Database schema

```
Admin
├── id (Int, PK)
├── username (String, Unique)
└── password (String, Hashed)

Question
├── id (Int, PK)
├── type (String)              # Evaluation type (e.g., AUDIO_AB)
├── audioUrlA / B / C (String) # Audio links
├── metricGroup (String)       # Bound scale group
└── ...

ScaleMetric
├── id (Int, PK)
├── group (String)             # Scale group name
├── type (String)              # basic | semantic_diff
├── points (Int)               # Scoring scale (e.g., 7-point scale)
└── leftLabel / rightLabel     # Semantic anchors (e.g., Warm - Cold)

Response
├── id (Int, PK)
├── sessionId (String)         # Session tracking
├── questionId (Int, FK)       # Associated question
├── choice (String)            # Serialized JSON response
└── createdAt (DateTime)
```

## Available scripts

### Backend (`/backend`)

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot-reload via `tsx watch` |
| `npm start` | Start the service in production mode |
| `npx prisma studio` | Open the browser-based database UI |

### Frontend (`/frontend`)

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Check TypeScript (`tsc -b`) and build static files |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## Deployment

### Frontend deployment

1. Build the app in the `frontend` directory:
   ```bash
   npm run build
   ```
2. Upload the `dist/` folder to a static host (Vercel, Netlify) or an Nginx server.
3. **Note**: Make sure your frontend API requests point to the production backend URL (you can set this in Vite's `.env.production`).

### Backend deployment

**VPS deployment (PM2)**:
1. Copy the code to your server.
2. Run `npm install`.
3. Sync the database: `npx prisma db push`.
4. Start the app with PM2:
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name "audiosurvey-backend"
   ```

**Docker notes**:
Because this project relies on SQLite and local file storage, if you deploy with Docker:
1. You need to mount volumes for `backend/prisma/dev.db` and `backend/uploads/`.
2. Expose the backend port and set up a reverse proxy (like Nginx).

## Troubleshooting

### JWT login failure
**Error**: Admin cannot log in, receiving Unauthorized.
**Solution**: Check if `JWT_SECRET` is set in `backend/.env`. If not, copy it from `.env.example` and restart the backend.

### Frontend audio file not found
**Error**: Audio cannot play in the Subject interface (404 Not Found).
**Solution**: Make sure the audio files are actually inside `backend/uploads/`. The backend's `express.static` route must map correctly to `/uploads`.

### Prisma error
**Error**: `The table main.Question does not exist in the current database.`
**Solution**: The database schema isn't synced. Run this in the `backend` directory:
```bash
npx prisma db push
```

## How to Add a New Language

The system supports automatic language loading and dynamic database string parsing. To add a new language (e.g., Korean `ko`):

1. **Create Language Dictionary**:
   Copy `frontend/src/locales/en.ts` to `frontend/src/locales/ko.ts` and translate the values. Vite will automatically load it.

2. **Add UI Button**:
   In `frontend/src/App.tsx`, add a language switcher button:
   ```tsx
   <button className="pixel-btn secondary" onClick={() => { changeLanguage('ko'); setMobileMenuOpen(false); }}>한국어</button>
   ```

3. **Update Database Text Parser**:
   In `frontend/src/utils/i18nUtils.ts`, add the language code and set its index (e.g., index 3 for the 4th language):
   ```typescript
   if (lang.startsWith('ko')) return parts[3] || parts[0];
   ```
   *Then, when writing database texts in the admin panel, format them as: `中文|English|日本語|한국어`.*

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
