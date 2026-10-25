# Architecture — Fashion Pro AI Studio

> Reflects the code as analyzed on 2026-10-07. Paths are relative to the repo root `D:\fashion pro`.

## 1. System Overview

```
┌─────────────────────────────┐        /api/*  (Vite proxy in dev)        ┌──────────────────────────────┐
│  Browser (React SPA)        │ ───────────────────────────────────────▶ │  Flask API  (port 5001)      │
│  Vite dev :5173             │ ◀─────────────── JSON / images ───────── │  blueprints + middleware     │
│  Tailwind 4, Framer Motion  │                                           └───────┬───────────┬──────────┘
│  Axios + localStorage JWT   │        /images/*  (static, both servers)          │           │
└─────────────────────────────┘                                                   │           │
                                                                    SQLAlchemy    │           │  HTTPS
                                                              ┌───────────────────▼──┐   ┌────▼──────────────────┐
                                                              │ MySQL  (primary)     │   │ LLM providers         │
                                                              │ SQLite (auto-fallback│   │ Groq → Gemini →       │
                                                              │  backend/fashion.db) │   │ OpenAI → rule engine  │
                                                              └──────────────────────┘   └───────────────────────┘
                                         Local filesystem: images/ (gallery, fashionrec, closet/, temp_search/)
```

Single-repo monolith: one SPA + one Flask app. No queue, cache, or worker; all image analysis runs synchronously inside request handlers.

## 2. Repository Layout

```
D:\fashion pro
├─ index.html, vite.config.js, tailwind.config.js, postcss.config.js, vitest.*
├─ package.json                  # scripts: dev, backend, start (concurrently), build, lint, test
├─ src/                          # React SPA
│  ├─ main.jsx                   # BrowserRouter > AuthProvider > App
│  ├─ App.jsx                    # layout + all routes, dark-mode state
│  ├─ contexts/AuthContext.jsx   # user/token in localStorage, login/logout/refreshProfile
│  ├─ services/api.js            # axios instance + per-domain service objects
│  ├─ utils/colorUtils.js
│  ├─ components/                # Navbar, Footer, Chatbot, SmartImage, WeatherRecommendation, ScrollToTop
│  └─ pages/                     # 27 pages (see §4)
├─ backend/
│  ├─ app.py                     # app factory-ish script: CORS, JWT, limiter, /images, blueprints
│  ├─ config/db.py               # MySQL-first init with SQLite fallback + create_all
│  ├─ middleware/                # rate_limiter.py, error_handler.py, validators.py
│  ├─ models/                    # user, outfit, like, recommendation, feedback, closet
│  ├─ routes/                    # auth, gallery, accessory, recommendations, chat, user_dashboard,
│  │                             # admin, feedback, closet, search  (+ gallery_fixed.py = dead code)
│  ├─ services/                  # email_service.py, recommendation_engine.py (stub)
│  ├─ utils/                     # color_utils.py (LAB/CIEDE2000/K-Means), fashion_color_harmony.py
│  ├─ tests/                     # pytest suite (15 tests)
│  ├─ *.py                       # ~20 one-off scripts: migrate_*, fix_*, load_fashionrec, setup_mysql, debug_* …
│  ├─ *.json                     # legacy stores: users, likes, gallery, saved_recommendations, recommendations
│  └─ schema.sql, mysql_reset_init.sql, requirements.txt, .env(.example)
├─ images/                       # casual, office, party, traditional, fashionrec, closet(private), temp_search
├─ public/, dist/                # static assets / build output
├─ .kilo/                        # editor-agent worktrees & config (not part of the product)
└─ README.md, DOCUMENTATION.md, TODO.md  (+ prd/architecture/rules/design/task/memory.md)
```

## 3. Backend

### 3.1 Request pipeline
`Request → CORS (allow-list) → Flask-Limiter (default PUBLIC_LIMIT, memory:// storage) → blueprint route → [@jwt_required / optional / admin_required] → validators → handler → centralized error handlers (generic JSON errors)`.

Key config (`backend/app.py`): JWT in `Authorization: Bearer` header only; access 24 h / refresh 30 d; `MAX_CONTENT_LENGTH` 16 MB; `/images/<path>` served with `safe_join` and a hard block on `closet/`; health check at `/`.

### 3.2 API surface

| Prefix / Route | Blueprint | Auth | Notes |
|---|---|---|---|
| `POST /api/auth/register`, `/login` | auth | public + IP & account limits | bcrypt, back-off on failures |
| `POST /api/auth/refresh` | auth | refresh JWT | unused by frontend |
| `GET /api/auth/profile`, `GET /api/auth/protected` | auth | JWT | |
| `POST /api/auth/forgot-password`, `/validate-reset-token`, `/reset-password` | auth | public (limited) | token stored on `users` row, emailed |
| `GET /api/gallery`, `/gallery/<id>`, `/outfits/<id>` | gallery | public | pagination `page`,`limit` |
| `POST /api/gallery/like`, `/api/like`; `GET /api/profile/liked` | gallery | JWT | |
| `POST /api/gallery/refresh` | gallery | public | no-op stub (returns a success message); remove or implement + admin-gate |
| `POST /api/accessory/analyze`, `/skin-tone/analyze`, `/color-combinations` | accessory | public | OpenCV + LAB; optional Gemini vision |
| `POST /api/recommendations` | recommendations | optional JWT | style matrix + personalisation |
| `POST /api/recommendations/save` | recommendations | JWT | `user_recommendations` table |
| `POST /api/ai-chat` | chat | optional JWT | provider chain, context builder |
| `GET /api/user/dashboard-stats`, `PUT /api/user/profile` | user_dashboard | JWT | |
| `/api/closet/items` (GET, POST), `/items/<id>` (GET, PUT, DELETE), `/items/<id>/image`, `/items/<id>/availability` (PATCH), `/capsule-generate` (POST) | closet | JWT, owner-scoped | |
| `POST /api/search/visual`, `GET /api/search/semantic`, `POST /api/search/index/outfits` | search | public (`public_limit`) | index endpoint should be admin |
| `POST /api/feedback` | feedback | public | |
| `GET /api/admin/stats`, `/users`, `/feedback` | admin | JWT + admin | role from DB, then `users.json` fallback |

> Frontend `api.js` defines `accessoryService.colorMatch` → `/color-match`, which has **no matching backend route** (currently unused by any page).

### 3.3 Data model (SQLAlchemy)

```
users (id, name, email UNIQUE, hashed_password, gender ENUM, member_since, avatar_url,
       is_admin, role, latitude, longitude, location_name,
       reset_token UNIQUE, reset_token_expires_at, created_at, updated_at)
   │1                                  │1                                │1
   │*                                  │*                                │*
liked_outfits (user_id, outfit_id,   user_recommendations (rec_type,   closet_items (name, category, sub_category,
  UNIQUE(user,outfit))                 rec_data JSON)                     color_name/hex, secondary_color_name,
   │*                                                                     pattern, style, occasion, season,
   │1                                                                     is_available, image_url, brand, tags, notes)
outfits (name, image_path, occasion ENUM(Casual|Office|Party|Traditional), category,
         primary_color, likes, views, is_active, extra_metadata JSON{palette_swatches, extracted_rgb, …})
feedback (name, email, message, rating)            color_combinations (schema.sql only, no model)
```

Schema management: `db.create_all()` at startup + idempotent `ensure_closet_schema()` ALTER-based migration; ad-hoc scripts for others (`migrate_add_reset_columns.py`, `migrate_and_fix.py`). `schema.sql` is **out of date** (no `closet_items`, wrong column names `metadata`, `DROP DATABASE`) and must not be run on real data. No Alembic.

### 3.4 Core domain modules
- **`utils/color_utils.py`** — RGB↔LAB, CIEDE2000, K-Means++ palette extraction, `FASHION_PALETTE`, EMD-like `palette_similarity`.
- **`utils/fashion_color_harmony.py`** (888 lines) — color-theory rules (complementary, analogous, triadic, skin-tone aware).
- **`routes/accessory.py`** (1132 lines) — skin-pixel detection (HSV/YCrCb), robust LAB stats, tone/undertone classifier, color scoring, recommendation generator, dataset style lookup (`datasets` → Gemini vision).
- **`routes/chat.py`** — builds a system prompt from `extract_user_context` (profile + DB likes/closet + gallery catalog), runs the provider chain with timeouts (Groq 8 s, OpenAI 6 s), falls back to `smart_fallback_chat` (static matrices).
- **`routes/closet.py`** — upload validation (extension + magic bytes + Pillow decode), unique filenames in `images/closet/`, auto color naming, capsule generator.
- **`middleware/rate_limiter.py`** — env-tunable limits, per-IP and per-account keys, in-memory failure back-off tracker (not shared across processes).

### 3.5 Database selection logic (`config/db.py`)
`USE_SQLITE=true` → SQLite. Otherwise test MySQL; if DB missing → `CREATE DATABASE`; if any other failure → silently fall back to `backend/fashion.db`. Pool: size 10 / overflow 20 / pre-ping / recycle 3600 s.

## 4. Frontend

### 4.1 Composition
`main.jsx` → `BrowserRouter` → `AuthProvider` → `App` (Navbar, `<Routes>`, Footer, Chatbot, ScrollToTop). Redux is not used anywhere in `src/` even though `@reduxjs/toolkit`/`react-redux` are dependencies. State is local `useState` + `AuthContext`.

### 4.2 Routes (`src/App.jsx`)
| Group | Routes |
|---|---|
| Core | `/`, `/recommendations`, `/gallery`, `/outfit/:id`, `/dashboard`, `/closet`, `/admin` |
| Tools | `/skin-tone` (+`/skintone`), `/body-type` (+`/bodytype`), `/occasion`, `/image-upload`, `/color-match` |
| Auth | `/login`, `/signup`, `/reset-password` |
| Info | `/about`, `/careers`, `/press`, `/blog`, `/feedback`, `/privacy`, `/terms`, `/cookies`, `/help`, `/contact` |
| Missing | `/accessory-match` (linked from Dashboard), catch-all 404 |

Route guarding is done **inside individual pages** (Dashboard, DigitalCloset, Admin) via `useAuth`; there is no shared `ProtectedRoute`.

### 4.3 API layer (`src/services/api.js`)
Axios instance with `baseURL=/api`; request interceptor attaches `fashionToken` from `localStorage`; response interceptor on 401/422 clears storage and hard-redirects to `/login?msg=session_expired` (except auth pages). Service objects: `authService, userService, accessoryService, galleryService, recommendationService, chatService, feedbackService, adminService, closetService, searchService`. `getImageUrl()` normalises image paths.

### 4.4 Largest / riskiest files
`SkinTone.jsx` (872), `Home.jsx` (651), `DigitalCloset.jsx` (631), `Footer.jsx` (566), `Gallery.jsx` (504), `WeatherRecommendation.jsx` (476), `Dashboard.jsx` (415). Candidates for decomposition.

## 5. Build, Run, Deploy

| Task | Command |
|---|---|
| Install | `npm install` · `cd backend && pip install -r requirements.txt` (venv at `.venv`) |
| Dev (both) | `npm start` (concurrently Vite :5173 + Flask :5001) |
| Frontend only / backend only | `npm run dev` / `npm run backend` |
| Tests | `npm test` (vitest) · `cd backend && python -m pytest tests` |
| Build | `npm run build` → `dist/` |

Vite plugin `serve-images` serves `/images/*` straight from disk in dev (so the SPA works without the backend); `/api` is proxied to `127.0.0.1:5001`. In production, Flask's `/images/<path>` route is the only static server, and nothing serves `dist/`.

**Environment (`backend/.env`):** `USE_SQLITE, DB_HOST/PORT/USER/PASSWORD/NAME, JWT_SECRET, GROQ_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY, CORS_ORIGINS, MAIL_*, FRONTEND_BASE_URL, PASSWORD_RESET_TTL_MIN, MAX_CONTENT_LENGTH_MB, CLOSET_MAX_UPLOAD_BYTES, SEARCH_MAX_UPLOAD_BYTES, RATELIMIT_STORAGE_URI, PORT, DEBUG`. Note `.env.example` lists `MAX_CONTENT_LENGTH=16MB`, but the code reads `MAX_CONTENT_LENGTH_MB`.

## 6. Cross-Cutting Concerns

| Concern | Today | Gap |
|---|---|---|
| AuthN | JWT bearer, bcrypt | Token in `localStorage` (XSS-exposed); no refresh flow client-side; no logout/revocation list |
| AuthZ | `admin_required`, owner-scoped closet queries | Admin flag also read from `users.json`; `search/index/outfits` is unauthenticated |
| Validation | `middleware/validators.py`, upload magic-byte checks | `chat`/`feedback` payload limits unverified |
| Errors | Central handlers, generic messages | Many `print()` instead of `logger` |
| Rate limiting | Flask-Limiter + custom back-off | `memory://` only works for a single process; use Redis in prod |
| Config | `.env` | Default JWT secret fallback exists in code (warns only) |
| Persistence | SQL + legacy JSON | Dual-write/fallback paths in `auth.py`, `admin.py`, `chat.py` add complexity |
| Observability | `logging.basicConfig` | No request IDs, metrics, or error tracking |

## 7. Technical Debt Register (ordered by priority)

1. **Security:** admin-gate `/search/index/outfits` (and remove the no-op `/gallery/refresh`); remove JSON-based admin fallback; fail startup in production when `JWT_SECRET` is default; move to httpOnly cookies or short-lived tokens + refresh rotation.
2. **Dead / duplicate code:** `routes/gallery_fixed.py`, `backend/app_simple.py`, root `check_db.py`/`fix_db.py` duplicates of `backend/*`, `backend/debug*.py`, `test_ai.py` (gitignored but present), `.kilo/worktrees/*` copies.
3. **Repo hygiene:** `users.json`, `likes.json`, `fashion.db`, user closet images appear in `git status`/tracking despite `.gitignore`; `.kilo/worktrees` is a full copy of the repo.
4. **Schema:** adopt Flask-Migrate/Alembic; regenerate or delete `schema.sql`; add `color_combinations` model or drop table.
5. **Deprecated deps:** `google-generativeai` → `google-genai`; `Flask 2.3` → 3.x; `datasets` is a heavy runtime dependency used for one lookup.
6. **Frontend:** unused Redux deps; no `ProtectedRoute`; missing 404 and `/accessory-match`; `api.js` `colorMatch` targets a non-existent endpoint; ESLint config absent though `npm run lint` is defined; 4 failing vitest tests (`IntersectionObserver` mock isn't a constructor under framer-motion).
7. **Testing:** root-level `backend/test_*.py` are scripts that hit a live server (`test_enhancements.py` fails with 401) — move into `tests/` using the Flask test client; add CI.
8. **Performance:** CPU-bound OpenCV/K-Means in request thread; palette extraction on demand per outfit during search; consider caching/async worker.
9. **Docs drift:** README tells users to paste API keys into `app.py` and shows a test login; DOCUMENTATION lists endpoints that don't exist (`/api/users/register`, `/api/recommendations/<email>`).

## 8. Target Architecture (next 2 releases)

- Keep the monolith; add **Flask-Migrate**, **Redis** (rate-limit storage + caching), and a **`ProtectedRoute`/`AdminRoute`** wrapper on the SPA.
- Extract `services/` layer (`skin_tone_service`, `chat_service`, `closet_service`) so route modules become thin (accessory.py 1.1 k lines and closet.py 631 lines first).
- Introduce a provider abstraction for LLMs (`LLMProvider.generate(messages)`), with env-driven model names and per-provider timeouts.
- Serve built SPA from a reverse proxy (nginx/Caddy) with `/api` and `/images` upstream; use object storage for closet images when scaling beyond one host.
