# Rules & Conventions — Fashion Pro AI Studio

Rules for anyone (human or AI agent) changing this repo. Derived from patterns already in the code plus fixes for the gaps found during analysis. **MUST** = non-negotiable, **SHOULD** = default unless there is a reason, **AVOID** = don't, unless justified in the PR.

## 1. General
- MUST read the surrounding code and follow its existing structure and naming before adding anything.
- MUST keep changes small and focused; one concern per commit/PR.
- MUST NOT add new top-level one-off scripts (`fix_*.py`, `debug_*.py`, `check_*.py`). Put reusable ops under `backend/scripts/` (create it) or as CLI commands, and delete throwaways after use.
- MUST NOT edit or rely on anything under `.kilo/worktrees/` — it is a stale copy of the repo, not source.
- MUST update `memory.md` (decisions/gotchas) and `task.md` (status) when finishing meaningful work.
- AVOID new dependencies; if one is needed, justify size/maintenance and pin the version (`requirements.txt`) / use a caret range (`package.json`).

## 2. Security (highest priority)
1. **Secrets:** never commit `.env`, API keys, passwords, or tokens. Only `backend/.env.example` with placeholders. Never print keys. The README must not instruct pasting keys into source files.
2. **JWT:** `JWT_SECRET` must be set (≥32 random chars) outside local dev. In production (`DEBUG` false) the app SHOULD refuse to start with the placeholder secret. Never log tokens.
3. **Authorization:** every route that mutates data, spends paid-API quota, or exposes another user's data MUST have `@jwt_required()`; admin routes MUST use `admin_required`. Ownership MUST be enforced in the query (`filter_by(user_id=current_user_id)`), never trusted from the request body. Admin status MUST come from the DB only (the `users.json` fallback is legacy — do not extend it).
4. **Uploads:** validate extension **and** magic bytes **and** Pillow decode; enforce size limits; generate server-side filenames (`uuid` + `secure_filename`); never serve user uploads from a public static route. Follow `routes/closet.py::_validate_image_content`.
5. **Passwords:** bcrypt only; run through the existing weak-password check; never return `hashed_password` or `reset_token` in any response.
6. **Reset tokens:** single-use, short TTL, cleared after use; responses to forgot-password MUST NOT reveal whether an email exists.
7. **Errors:** return generic messages to clients (`{'error': '…'}`), log details server-side with `logger`. Never return exception text or stack traces.
8. **CORS:** explicit origin allow-list from `CORS_ORIGINS`; never `*` for credentialed routes (the current `*` on `/images` is acceptable for public static images only).
9. **Rate limits:** every public endpoint that is expensive (image analysis, LLM, search, auth) MUST carry a limiter decorator (`auth_limit`, `public_limit`, `authed_limit`). `/api/ai-chat` MUST be limited and MUST cap message length and history size.
10. **Frontend:** never use `dangerouslySetInnerHTML` with user/LLM content (chat uses `react-markdown` — keep it). Do not store anything more sensitive than the JWT in `localStorage`; prefer migrating to httpOnly cookies.
11. **Privacy:** face/skin-tone photos are processed in memory and not persisted; temp files (`images/temp_search`) MUST be deleted after the request. Don't send user photos to third-party APIs without explicit consent text in the UI.

## 3. Backend (Python / Flask)
### Structure
- New feature = `routes/<name>.py` (thin: parse → validate → call service → serialize) + `services/<name>_service.py` (logic) + `models/<name>.py` (tables) + `tests/test_<name>.py`. Register the blueprint in `app.py`.
- Blueprints use `url_prefix='/api…'`; path params typed (`<int:id>`); JSON in/out only (multipart for uploads).
- Business logic does NOT belong in route files (accessory.py / closet.py are already too large — don't grow them; extract).

### Style
- PEP 8, 4-space indent, `snake_case` functions/vars, `PascalCase` classes, `UPPER_SNAKE` constants. Type hints for new functions. Docstring for every public function (one line minimum).
- Use `logger = logging.getLogger(__name__)`; **no `print()`** in new code (remove existing ones when touching a file).
- Read config via `os.getenv` at one place (`app.py` / `config/`), with safe defaults; add every new variable to `.env.example` and `architecture.md` §5.
- Parse request input with `request.get_json(silent=True) or {}` and validate through `middleware/validators.py`.

### Database
- Use SQLAlchemy models; no raw string-formatted SQL (parameterize with `text()` + bind params). The existing `ALTER TABLE` strings in `ensure_closet_schema` are static constants — keep it that way.
- Schema changes go through a migration (introduce Flask-Migrate; until then idempotent, additive-only `ensure_*_schema()` functions). Never `DROP` in code; never run `schema.sql` against existing data.
- Always `db.session.rollback()` on failure; commit once per request unit of work.
- Do not write new data to `*.json` files. JSON files are read-only seed/legacy fallbacks.
- Datetimes: store UTC (`datetime.utcnow` today → prefer timezone-aware `datetime.now(timezone.utc)` in new code).

### AI / LLM
- All provider calls MUST have a timeout and be wrapped in try/except with fallthrough to the next tier; the rule-based fallback MUST always return a valid reply.
- Model names MUST be configurable through env vars; do not hard-code retired models. Migrate off `google-generativeai` to `google.genai`.
- Never put raw user-controlled text into the *system* prompt unescaped beyond the profile fields already whitelisted; truncate history (≤8 turns) and message (≤1000 chars).
- Respond to the user in the language they used (English/Hindi/Hinglish).

### Image / color analysis
- Work in CIELAB; use CIEDE2000 for perceptual distance. Don't introduce RGB Euclidean comparisons.
- Resize large images before processing; wrap OpenCV/Pillow work in try/except and return a 4xx with a helpful message for undecodable images.
- Add a test with a synthetic image for any new analysis function (see `tests/test_accessory_analysis.py`).

## 4. Frontend (React / Vite / Tailwind)
### Structure
- Pages in `src/pages/<PascalCase>.jsx`, reusable UI in `src/components/`, API calls ONLY through `src/services/api.js` service objects (no `fetch`/`axios` inside components), shared state through context (`AuthContext`) — do not add Redux (it is unused; remove the dependency if no one adopts it).
- New route → add it in `App.jsx` **and** Navbar/Footer if user-facing. Every `navigate()`/`<Link>` target MUST exist.
- Protected pages MUST use a shared `ProtectedRoute` (to be created) rather than ad-hoc checks; admin pages use `AdminRoute`. Client checks are UX only — the backend is the authority.
- Split files > ~400 lines into subcomponents/hooks (`SkinTone.jsx`, `Home.jsx`, `DigitalCloset.jsx` first).

### Style
- Function components + hooks only; one component per file; `PascalCase` components, `camelCase` variables, files named after the default export.
- Tailwind utility classes using the design tokens in `design.md` (no hard-coded hex colors, no inline `style` unless dynamic).
- Every async call handles loading, error, and empty states; show user-friendly errors (never raw `error.message` from the server blindly).
- Use `SmartImage` for gallery/outfit images (fallbacks + lazy load); always provide meaningful `alt`.
- Don't read `localStorage` directly in pages (`ColorMatch`, `Recommendations`, `Gallery` currently do) — use `useAuth()`.
- Animations: Framer Motion, respect `prefers-reduced-motion`; no layout shift.
- Accessibility: semantic elements, labelled inputs, visible focus ring, ≥ 4.5:1 text contrast in both themes, buttons are `<button>`, keyboard-reachable modals.

## 5. Testing
- **MUST** add/adjust tests with every behaviour change. Backend: `pytest` with Flask test client in `backend/tests/` (SQLite in-memory/temp via `conftest.py`). Frontend: `vitest` + Testing Library next to the component (`*.test.jsx`).
- **MUST NOT** add tests that require a running server, real network, or real LLM keys (e.g. `backend/test_enhancements.py` — move/convert or delete).
- Mock `IntersectionObserver` as a constructible class in `vitest.setup.js` (current mock breaks framer-motion `whileInView`).
- Required before merge: `cd backend && python -m pytest tests` and `npm test -- --run` green; `npm run build` succeeds.
- Security-relevant code (auth, closet privacy, admin gating, upload validation) needs negative tests (wrong user, wrong type, oversize).

## 6. Git & Repo Hygiene
- Branch: `feat/…`, `fix/…`, `chore/…`. Commit messages: Conventional Commits (`feat(closet): …`).
- MUST NOT commit: `.env`, `fashion.db`, `users.json`, `likes.json` (user data), `images/closet/`, `images/temp_search/`, `images/uploads/`, `node_modules`, `dist`, `.venv`, `__pycache__`. If they're already tracked, untrack with `git rm --cached` (see `task.md`).
- Large datasets/images: only curated gallery/fashionrec assets belong in git; document their source/license.
- Don't force-push shared branches; don't rewrite history to hide a leaked secret — rotate the secret.

## 7. Documentation
- `README.md` = quick start only (accurate commands, no credentials). `DOCUMENTATION.md` = API reference — update when endpoints change. `architecture.md`, `design.md`, `prd.md` updated when the corresponding thing changes. `TODO.md` is superseded by `task.md`.
- New env var ⇒ `.env.example` + `architecture.md`. New route ⇒ `architecture.md` §3.2 + `DOCUMENTATION.md`.

## 8. Definition of Done
- [ ] Works locally with and without MySQL, with and without LLM keys.
- [ ] Auth/ownership/rate-limit considered for every new endpoint.
- [ ] Tests added and green (backend + frontend), build passes.
- [ ] No new `print()`, dead code, TODOs without an issue/task ID, or secrets.
- [ ] Loading/error/empty UI states + dark mode + mobile checked.
- [ ] Docs and `memory.md`/`task.md` updated.
