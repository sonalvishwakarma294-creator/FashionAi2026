# Design System & UX — Fashion Pro AI Studio

> Derived from `tailwind.config.js`, `src/index.css`, `index.html` and the page/component code. "Current" = what exists; "Target" = recommended consolidation.

## 1. Brand & Voice
- **Personality:** premium, warm, confident personal stylist — editorial (serif display headings) meets modern tech (clean sans body).
- **Name inconsistency to fix:** UI/title says "FashionAI", package is `fashion-ai`, backend says "Fashion Pro AI", chatbot says "FashionPro AI / StyleSync Pro". **Decision needed:** pick one (recommended: **Fashion Pro**) and apply across `index.html` title/meta, Navbar, Footer, chatbot prompt, emails (`MAIL_FROM_NAME="Fashion Pro"` already).
- **Tone:** encouraging, specific, never judgmental about bodies or skin; Hinglish is welcome in chat. Use "flatter / balance / highlight" rather than "hide / fix / slim".

## 2. Design Tokens

### 2.1 Color (from `tailwind.config.js`)
| Token | Hex | Use |
|---|---|---|
| `primary` | `#7C3AED` (violet-600) | Brand, primary buttons, active nav, links, focus |
| `secondary` | `#F43F5E` (rose-500) | Gradient partner, likes/hearts, destructive-adjacent accents |
| `accent` | `#F59E0B` (amber-500) | Highlights, badges, ratings |
| `background` | `#F8FAFC` | Light page background |
| `darkBackground` | `#0F172A` | Dark page background |
| `text` | `#1F2937` | Light-mode body text |
| `darkText` | `#F1F5F9` | Dark-mode body text |

Page-level gradients seen in the code: `from-primary to-secondary` (hero/CTA cards), `emerald-500→600` (skin-tone card), `purple-500→600` (accessory card).

**Target additions:** semantic tokens `success #10B981`, `warning #F59E0B`, `danger #EF4444`, `info #3B82F6`, `surface` / `surface-dark` (cards), `border` / `border-dark`; define them in `tailwind.config.js` so pages stop using raw palette classes. Verify `primary` on `background` and white-on-`primary` meet 4.5:1 (violet-600 on white ≈ 5.7:1 ✓; `text-primary` on `darkBackground` ≈ 3.4:1 ✗ → use `primary-300` in dark mode).

### 2.2 Typography
| Role | Family | Notes |
|---|---|---|
| Body / UI | **Inter** 400–900 (base weight 450, `leading-relaxed`) | `font-sans` |
| Display (tech headings) | **Space Grotesk** 400–700 | `.font-display` utility (note: the Tailwind config maps `font-display` to Playfair, but `index.css` overrides it to Space Grotesk — **conflict**; resolve by keeping `font-display` = Space Grotesk and using `font-serif-display` for Playfair) |
| Editorial accents | **Playfair Display** 600–900 | `.font-serif-display`, hero/quotes |

Patterns: very heavy weights (`font-black`) with `uppercase tracking-widest` micro-labels (`text-[10px]`) — **target:** minimum 11–12 px for any text, keep `.font-track-caps` (0.14 em) for labels. Headings use `letter-spacing: -0.01em`; body uses antialiasing + `optimizeLegibility`.

Scale (target): `text-xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30 / 4xl 36 / 5xl 48 / 6xl 60`; hero uses 5xl–6xl on desktop, 3xl–4xl on mobile.

### 2.3 Spacing, Radius, Elevation
- Spacing: Tailwind 4 px base; section padding `py-16 md:py-24`, container `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Radius: pills (`rounded-full`) for buttons/chips; cards `rounded-2xl`–`rounded-3xl`; dashboard hero cards use `rounded-[2.5rem]` (**keep as a "feature card" variant only**).
- Elevation: `shadow-md` (cards), `shadow-xl/2xl` (hero/feature cards, modals), `backdrop-blur-md` + `bg-white/10` for glass overlays on images.

### 2.4 Motion
- Tailwind keyframes: `fade-in 0.5s`, `slide-up 0.5s` (20 px), `float 3s infinite`. Framer Motion for page/section transitions (`AnimatePresence mode="wait"` in `App.jsx`) and `whileInView` reveals.
- Rules: durations 150–300 ms for UI feedback, ≤ 600 ms for entrances; ease-out; honor `prefers-reduced-motion`; `float` only on decorative elements.
- Global `a, button { transition-all duration-200 }`.

### 2.5 Dark Mode
`darkMode: 'class'`; `App.jsx` toggles `dark` on `<html>`. Currently **not persisted** and ignores system preference → target: init from `localStorage` → `prefers-color-scheme`, persist on toggle. Use `dark:` variants on every surface/text/border.

## 3. Layout & Responsiveness
- Shell (`App.jsx`): `min-h-screen`, `overflow-x-hidden`, fixed `Navbar` (scroll state at 50 px adds background/blur), page content, `Footer`, floating `Chatbot` (bottom-right), `ScrollToTop`.
- Breakpoints: Tailwind defaults (`sm 640, md 768, lg 1024, xl 1280`). Mobile-first. Grids: gallery 2 → 3 → 4 columns; dashboard cards 1 → 2 → 3.
- `html/body` clamp `max-width: 100vw; overflow-x: hidden` — keep, but fix the cause of overflow rather than hide it where possible.
- Touch targets ≥ 44 × 44 px; `touch-action: manipulation` already set.

## 4. Information Architecture & Navigation
Primary nav (Navbar): **Home · Closet · Recommendations · Gallery · Skin Tone · Color Harmony · Body Type · Occasion · Feedback** (+ **Admin** for admins), right side: dark-mode toggle, Login / Sign up or Dashboard.
- 9–10 top-level items is too many for mobile and mid-width laptops → **Target:** group into *Discover* (Gallery, Recommendations, Occasion), *Analyze* (Skin Tone, Body Type, Color Harmony), *My Style* (Closet, Dashboard); keep Feedback in the footer.
- Fix: Dashboard card links to `/accessory-match` (no route) → point to `/image-upload` or build the page; add a 404 page; add breadcrumbs/back affordance on `/outfit/:id` (exists).

### Core user flows
1. **Onboarding:** Home → Sign up → Dashboard (empty state prompts: run Skin Tone, pick Body Type, add 3 closet items).
2. **Get outfits:** Recommendations → choose gender/body type/occasion → results → Save → Dashboard.
3. **Find my colors:** Skin Tone → upload/take selfie (quality tips + consent) → tone/undertone + palette → "Shop my palette" (gallery filtered by those colors).
4. **Closet:** Add item (photo → auto color) → filter → Generate capsule → save/like looks.
5. **Search:** Image upload (visual search) or text query → ranked outfits with "why it matched" chips.
6. **Ask the stylist:** Floating chat on any page → quick-reply chips → markdown answer with outfit/color sections.

## 5. Component Library

| Component | Anatomy & rules |
|---|---|
| **Button** | Primary: `bg-primary text-white rounded-full px-6 py-3 font-semibold hover:brightness-110`; Secondary: outline `border-primary text-primary`; Ghost; Danger: rose. States: hover, focus-visible ring (`ring-2 ring-primary/50 ring-offset-2`), disabled (50 % opacity + `cursor-not-allowed`), loading (spinner + disabled). |
| **Card** | `rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-md`; hover lift `-translate-y-1 shadow-xl`. |
| **Outfit tile** (Gallery) | `SmartImage` 3:4, overlay gradient on hover, like heart (secondary), occasion badge, name; click → `/outfit/:id`. |
| **Inputs** | Label above, `rounded-xl`, 2 px focus ring in primary, inline error text in danger color with `aria-describedby`. |
| **Badges / Chips** | Pill, 12 px semi-bold; occasion filter chips toggle `bg-primary text-white` when active. |
| **SmartImage** | Lazy loading, skeleton shimmer, onError fallback placeholder, `alt` required. Has tests (`SmartImage.test.jsx`). |
| **Color swatch** | 40–48 px circle with 1 px border for light colors, tooltip with name + hex, `aria-label`. Used in skin-tone/closet/color-match. |
| **Chatbot** | Floating 48/56 px black rounded-2xl launcher (README says "green" – outdated; **target: brand primary**), panel ≈ 380 × 560 desktop / full-screen sheet on mobile, user bubble primary, bot bubble neutral with `react-markdown`, quick-reply chips, typing indicator, language toggle (EN/HI). |
| **Modals / Toasts** | Focus-trapped, Esc to close, `role="dialog"`; toasts `aria-live="polite"`, auto-dismiss 4 s. |
| **Empty / Error / Loading** | Every list/page needs all three: skeletons for loading, illustration + CTA for empty, retry button for error. |
| **Navbar** | Sticky, transparent on top → blurred solid after 50 px scroll; active link highlighted with primary pill + icon; mobile hamburger drawer. |
| **Footer** | 5 columns (Brand, Product, Company, Legal, Social), already extensive (566 lines → split into data + components). |

## 6. Page-by-Page Notes
| Page | Purpose | UX notes |
|---|---|---|
| Home | Hero + feature grid (`navigate(f.path)`), trending outfits, CTA | Largest page (651 lines): split; add social proof |
| Recommendations | Gender + body type + occasion → look cards | Show advice text; save button needs login nudge |
| Gallery | Filter + paginate + like | Infinite scroll / "load more", filter persistence in URL |
| SkinTone | Photo → tone/undertone/palette | Add lighting tips, quality warning, consent copy, privacy note; 872 lines → split into Upload / Result / Palette |
| BodyType | Visual selector of silhouettes | Illustrated icons, inclusive labels |
| Occasion | Occasion tiles → outfits | Add Indian occasions (wedding, festival) to match chat |
| ColorMatch | Pick/upload color → harmonies | Show swatches with hex/name; copy-to-clipboard |
| ImageUpload | Accessory/outfit analysis | Preview, progress, result cards |
| DigitalCloset | CRUD wardrobe + capsule generator | Grid with category tabs, availability toggle, drag-drop upload |
| Dashboard | Stats, saved reports, liked outfits, profile | Empty-state onboarding checklist |
| Admin | Totals, users, feedback tables | Add search/pagination, export; confirm destructive actions |
| Login / Signup / Reset | Auth forms | Inline validation, password strength meter, show/hide password |
| Static pages | About, Careers, Press, Blog, Help, Contact, Privacy, Terms, Cookies | Several are 13–29-line stubs (Privacy/Terms/Cookies/Help/Contact) → need real content before launch |

## 7. Accessibility Checklist (target WCAG 2.1 AA)
- Color contrast ≥ 4.5:1 (text) / 3:1 (UI) in light **and** dark.
- All images have `alt`; decorative ones `alt=""`; color swatches expose name via `aria-label`, never color alone.
- Keyboard: tab order logical, visible `:focus-visible`, chat/modals trap focus, skip-to-content link.
- Forms: `<label for>`, error summaries, `aria-invalid`.
- Motion: respect `prefers-reduced-motion`; no auto-playing carousels without pause.
- Text resizable to 200 %; no text below 11 px.

## 8. Imagery & Content Guidelines
- Gallery images: portrait 3:4, ≥ 800 px long edge, WebP/JPEG ≤ 200 KB, named by occasion (`casual/c1.jpg`). Record source/licence for `fashionrec` and gallery images.
- Closet images: privacy-sensitive; never shown outside the owner's session.
- Copy for analysis results: explain confidence and limitations ("Based on your photo's lighting…").

## 9. Design Debt / Improvements
1. Reconcile `font-display` definition conflict (§2.2) and brand name (§1).
2. Persist dark mode + respect system setting.
3. Centralize reusable `Button`, `Card`, `Input`, `Badge`, `Modal`, `Toast`, `EmptyState`, `Skeleton` components; replace per-page copies of the same class strings.
4. Replace `text-[10px]` micro-labels with ≥ 11–12 px.
5. Consolidate navbar into grouped menus (§4).
6. Add a 404 page and fix the `/accessory-match` link.
7. Align the black chatbot launcher with brand primary. Fix corrupted emoji (`??`) in `Chatbot.jsx` section headers (see `memory.md`). `public/` also contains stand-alone `about/cookies/privacy.html` that duplicate SPA pages — remove or redirect.
8. Audit contrast (esp. `text-primary` on dark backgrounds, white text over gradient cards, text over images) and add gradient scrims.
