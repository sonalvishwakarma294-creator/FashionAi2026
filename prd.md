# Product Requirements Document (PRD) — Fashion Pro AI Studio

> Status: living document · Last analyzed: 2026-10-07 · Version: 1.0 (reflects the codebase as it exists today)

## 1. Product Summary

**Fashion Pro AI Studio** (internal package name `fashion-ai`, AI persona "StyleSync Pro" / "FashionPro AI") is a web-based personal-stylist platform. It turns a user's photo, body type, skin tone, occasion, weather, and wardrobe into concrete outfit and color recommendations, and offers an AI chat stylist, a curated outfit gallery, and a digital closet.

**Stack:** React 18 + Vite + Tailwind 4 (frontend) · Flask 2.3 + SQLAlchemy + JWT (backend) · MySQL (primary) with automatic SQLite fallback · Groq → Gemini → OpenAI → rule-based LLM chain.

## 2. Problem & Opportunity

| Problem | How the product addresses it |
|---|---|
| People don't know which colors suit their skin tone/undertone | Skin-tone Lab: multi-region LAB/HSV skin analysis → ranked color palette |
| Generic fashion advice ignores body shape and occasion | Body-type and occasion engines with a style matrix per gender × occasion × body type |
| Owned clothes go unused | Digital Closet with auto color detection + capsule-wardrobe generation |
| Inspiration is hard to find/search | Gallery (~240 curated images), visual (palette) search, semantic search |
| Advice feels impersonal | Context-aware chatbot that sees likes, closet, skin tone, body type, weather |

## 3. Target Users / Personas

1. **Style Seeker (primary)** — 18–35, wants quick "what do I wear to X" answers. Mostly mobile. English/Hindi-speaking (chatbot is Hinglish-friendly; Indian occasions such as wedding, sangeet, diwali, eid are first-class).
2. **Wardrobe Organizer** — uploads clothes to the closet, wants outfit/capsule suggestions from what they already own.
3. **Admin / Operator** — views user counts, user list, feedback; seeds the gallery and palette index.

## 4. Goals & Success Metrics

| Goal | Metric (proposed — none are instrumented yet) |
|---|---|
| Activation | % of signups who run ≥1 analysis (skin tone / body type / recs) in first session |
| Engagement | Likes per active user, chat messages per session, closet items per user |
| Retention | 7-day / 30-day return rate; saved recommendations per user |
| AI quality | Chat fallback rate (non-LLM replies), 👍/👎 on replies, feedback rating avg |
| Reliability | API p95 latency, 5xx rate, image-analysis failure rate |

**Non-goals (v1):** e-commerce checkout, social feed/following, native mobile apps, virtual try-on, payments.

## 5. Functional Requirements

Legend — **Status:** ✅ implemented · 🟡 partial/needs work · ⬜ not started. **Auth:** 🌐 public · 🔑 login required · 🛡 admin.

### 5.1 Accounts & Auth
| ID | Requirement | Auth | Status |
|---|---|---|---|
| F-AUTH-1 | Register with name, email, password, gender; bcrypt hashing; weak-password blocklist | 🌐 | ✅ |
| F-AUTH-2 | Login → JWT access (24h) + refresh (30d) token; per-IP and per-account rate limiting with back-off | 🌐 | ✅ |
| F-AUTH-3 | Forgot / validate / reset password via emailed token (TTL 30 min, SMTP optional; dev mode logs link) | 🌐 | ✅ |
| F-AUTH-4 | Profile fetch/update (`/auth/profile`, `/user/profile`) incl. persisted location | 🔑 | ✅ |
| F-AUTH-5 | Frontend uses refresh token to silently renew sessions | 🔑 | ⬜ (endpoint exists, client ignores it) |
| F-AUTH-6 | Role-based admin access | 🛡 | ✅ backend · 🟡 frontend (Admin page checks client-side only) |

### 5.2 Analysis Tools
| ID | Requirement | Auth | Status |
|---|---|---|---|
| F-SKIN-1 | Upload face/selfie → skin tone (Fair/Medium/Dark…), undertone, quality assessment, ranked color recommendations | 🌐 | ✅ (`POST /api/skin-tone/analyze`) |
| F-BODY-1 | Choose body type per gender → styling guidance | 🌐 | ✅ (frontend + `/recommendations`) |
| F-OCC-1 | Occasion page → outfit suggestions (Casual / Office / Party / Traditional + wedding, date, college, travel, festival in chat) | 🌐 | ✅ |
| F-COL-1 | Color match and color combinations (`/color-match`, `/color-combinations`) using harmony rules + CIEDE2000 | 🌐 | ✅ |
| F-ACC-1 | Accessory/outfit image analysis (`/accessory/analyze`) with optional Gemini vision and fashionrec dataset | 🌐 | ✅ (dashboard links to a non-existent `/accessory-match` route → 🟡) |
| F-WEA-1 | Weather-aware recommendation widget | 🌐 | ✅ |

### 5.3 Recommendations
| ID | Requirement | Auth | Status |
|---|---|---|---|
| F-REC-1 | `POST /api/recommendations` returns looks from gender × occasion × body-type matrix, personalised by likes/closet when logged in | optional | ✅ |
| F-REC-2 | Save a recommendation report to the dashboard | 🔑 | ✅ |
| F-REC-3 | Real recommendation engine (collaborative / content-based) replacing static matrix | — | 🟡 (`services/recommendation_engine.py` is a 68-line stub) |

### 5.4 Gallery & Discovery
| ID | Requirement | Auth | Status |
|---|---|---|---|
| F-GAL-1 | Paginated gallery with occasion filter, outfit detail page | 🌐 | ✅ |
| F-GAL-2 | Like / unlike outfit; liked list synced to dashboard | 🔑 | ✅ |
| F-SRCH-1 | Visual search: upload image → K-Means++ palette (LAB) → palette-similarity ranking + occasion/category boost | 🌐 (rate-limited) | ✅ |
| F-SRCH-2 | Semantic (text) search over outfits | 🌐 | ✅ |
| F-SRCH-3 | Admin trigger to index/cached outfit palettes (`/search/index/outfits`) | currently **unauthenticated** | 🟡 |

### 5.5 Digital Closet
| ID | Requirement | Auth | Status |
|---|---|---|---|
| F-CLO-1 | Upload item (magic-byte + Pillow validation, ≤8 MB), auto color extraction, metadata (category, pattern, style, season, occasion, brand, tags, notes) | 🔑 | ✅ |
| F-CLO-2 | List/filter, view, edit, toggle availability, delete | 🔑 | ✅ |
| F-CLO-3 | Private images served only through an authenticated endpoint (`/closet/items/:id/image`); `/images/closet/*` blocked | 🔑 | ✅ (covered by `test_closet_privacy.py`) |
| F-CLO-4 | Capsule-wardrobe generation from available items | 🔑 | ✅ |

### 5.6 AI Chat Stylist
| ID | Requirement | Auth | Status |
|---|---|---|---|
| F-CHAT-1 | Floating chatbot on every page, markdown rendering, quick-reply chips, EN/HI | optional | ✅ |
| F-CHAT-2 | Context injection: gender, body type, skin tone, style, weather, occasion, liked outfits, closet items, gallery catalog | optional | ✅ |
| F-CHAT-3 | Provider chain Groq (llama-3.3-70b → 3.1-8b) → Gemini → OpenAI (gpt-4o-mini) → rule-based fallback engine | — | ✅ |
| F-CHAT-4 | Chat history persistence across sessions | 🔑 | ⬜ (history is client-side only, last 8 turns sent) |

### 5.7 Dashboard, Feedback, Admin, Static Pages
- **Dashboard** (🔑 ✅): stats, saved reports, liked outfits, profile edit, quick links.
- **Feedback** (🌐 ✅): name, email, message, 1–5 rating → admin list.
- **Admin** (🛡 ✅ basic): total users, total feedback, user list, feedback list.
- **Static/marketing pages** (✅): Home, About, Careers, Press, Blog, Help, Contact, Privacy, Terms, Cookies.
- **UX:** dark mode toggle ✅, responsive layout ✅, scroll-to-top ✅.

## 6. Non-Functional Requirements

| Area | Requirement | Current state |
|---|---|---|
| **Security** | Hashed passwords, JWT auth, CORS allow-list, upload validation, generic error messages, rate limiting | ✅ largely; see gaps in `rules.md` §Security and `task.md` |
| **Privacy** | User photos (closet) private; analysis uploads not retained; privacy/cookie pages | 🟡 policy pages are boilerplate; `images/temp_search` retains files |
| **Performance** | Analysis endpoints < 5 s for ≤8 MB image; gallery page < 300 ms | not measured |
| **Availability** | Backend must start without MySQL (SQLite fallback) and without LLM keys (rule-based chat) | ✅ |
| **Accessibility** | WCAG 2.1 AA target (contrast, keyboard, alt text, focus) | 🟡 not audited |
| **i18n** | English + Hindi chat; UI English only | 🟡 |
| **Browser support** | Latest Chrome/Edge/Safari/Firefox, mobile Safari/Chrome | untested |
| **Observability** | Structured server logs; no client error reporting | 🟡 many `print()` calls remain |
| **Testability** | Backend pytest + frontend vitest in CI | 🟡 no CI; 4 failing frontend tests |

## 7. Data Requirements

Entities: `users`, `outfits`, `liked_outfits`, `user_recommendations`, `feedback`, `closet_items`, plus `color_combinations` (schema.sql only). Legacy JSON stores (`users.json`, `likes.json`, `gallery.json`, `saved_recommendations.json`, `recommendations.json`) still act as fallbacks/seed data. Details in `architecture.md`.

Datasets: ~240 gallery images (casual 60, office 49, traditional 29, party 23, base 18) and 50 `fashionrec` images (HuggingFace `datasets` source, loaded by `load_fashionrec.py`).

## 8. Release Scope

### MVP (current — essentially shipped)
Auth, gallery + likes, skin tone, body type, occasion, color match, recommendations, chatbot, dashboard, digital closet, visual search, feedback, admin basics.

### v1.1 — "Harden & Polish" (recommended next)
Close the security gaps (admin-gating index endpoint, token storage, JWT secret enforcement), remove dead/duplicated code, fix broken `/accessory-match` link, protected-route guards, green CI, and finish the dashboard/closet flows.

### v1.2 — "Personalise"
Real recommendation engine, persistent chat history, user style profile (saved skin tone/body type used everywhere), outfit builder from closet, favourites collections.

### v2 — "Grow"
Shopping links/affiliate, social sharing, PWA/mobile, analytics dashboard, multi-language UI.

## 9. Risks & Open Questions

| # | Risk / question | Impact | Mitigation |
|---|---|---|---|
| R1 | `google-generativeai` is deprecated (end-of-support warning in test output) and `gemini-pro-vision` / `gemini-1.5-flash` model names are retired | Chat tier 2 and vision analysis will fail silently | Migrate to `google-genai`, make model names env-configurable |
| R2 | LLM cost/abuse on unauthenticated `/ai-chat` | Cost, quota exhaustion | Rate-limit per IP, cap message length/history |
| R3 | Skin-tone analysis bias across lighting/skin diversity | Trust, fairness | Quality score, user-visible confidence, test set across tones |
| R4 | Biometric-adjacent data (face photos) | Legal (DPDP/GDPR) | Process in-memory, don't persist, explicit consent text |
| R5 | Three data sources of truth (DB, JSON files, `gallery.json`) | Inconsistent behaviour | Complete migration to SQL; keep JSON as seed only |
| Q1 | Is the Hindi-first positioning the long-term target market? | Content/i18n scope | Decide before building UI i18n |
| Q2 | Monetisation model? | Roadmap | Decide before v2 |

## 10. Acceptance Criteria (v1.1 exit)
- All backend (`pytest backend/tests`) and frontend (`vitest run`) tests pass in CI.
- No endpoint that mutates data or spends paid-API quota is callable anonymously without a rate limit; index/seed endpoints are admin-only.
- Every route linked from the UI exists; protected pages redirect unauthenticated users.
- No secrets, user data JSON, or uploaded user images are tracked in git.
- README/DOCUMENTATION match reality (no hard-coded credentials or "paste key into app.py" instructions).
