# extractable-components.md — DraftComponent Candidate Menu

Catalog of components worth extracting as reusable Superdesign `DraftComponent` entities, drawn from the pages/components covered in this init (landing, sign-in, dashboard home + dashboard layout). Full source for everything referenced here lives in `components.md` (UI primitives) and `layouts.md` (layout components); this file lists props/hardcoded split only, per the INIT spec.

---

## Layout Components (appear on most/all pages of their section)

### Navbar (landing)
- Source: `app/page.js` (local function `Navbar`, NOT a separate file — lines ~149-194)
- Category: layout
- Description: Fixed, sticky top nav for the landing page only — dark terminal theme, logo + wordmark, anchor links, sign-in/get-started actions.
- Extractable props: `onGetStarted` (callback, currently always `() => router.push("/dashboard")`)
- Hardcoded: "PrepTalk_" wordmark + blinking cursor span, `#features`/`#how-it-works` anchor labels & hrefs, "sign in"/"get started" button copy, all `.pt-*` theme classes, logo src (`/logo.svg`).

### Footer (landing)
- Source: `app/page.js` (local function `Footer`, NOT a separate file — lines ~740-762)
- Category: layout
- Description: Simple 3-column footer (logo, dynamic copyright, anchor links) for the landing page.
- Extractable props: none meaningful (fully static besides `new Date().getFullYear()`)
- Hardcoded: logo src, "PrepTalk" text, copyright tagline "Practice makes ready.", `#features`/`#how-it-works` links.

### Header (dashboard top nav)
- Source: `app/dashboard/_components/Header.jsx`
- Category: layout
- Description: Sticky glass-effect nav for every `/dashboard/**` page — logo, desktop link row, theme toggle, avatar dropdown (with inline username editor + sign out), and a full mobile slide-in drawer.
- Extractable props: `activeItem`/`currentTab` equivalent is derived internally from `usePathname()` (not passed in) — if extracted as a DraftComponent, expose `activePath` (string) to drive the active-link highlight; `userInitials` (string), `username` (string|null), `userEmail` (string), `menuOpen`/`mobileOpen` (boolean, for static preview states).
- Hardcoded: `navLinks` array (Dashboard/Questions/Analytics/Leaderboard/Upgrade/How it works — labels + hrefs), all dropdown menu items (My Roadmap, Interview Tracker, Interview Journal, Behavioral Coach, Resume Analyzer, Settings) with their icons/hrefs, logo src, all icon choices, all CSS classes.

### Dashboard App Shell / Layout Wrapper
- Source: `app/dashboard/layout.jsx`
- Category: layout
- Description: Wraps every dashboard page in `Header` + global `UsernameModal` + a centered `<main>` content well.
- Extractable props: none (pure structural wrapper, `children` only)
- Hardcoded: responsive margin classes (`mx-5 md:mx-20 lg:mx-36 py-10`).

### UsernameModal (cross-cutting overlay)
- Source: `app/dashboard/_components/UsernameModal.jsx`
- Category: layout (global overlay, not a page-specific component)
- Description: Force-prompt modal shown over any dashboard page until a new user sets a username.
- Extractable props: `show` (boolean, for static preview), `loading` (boolean), `error` (string)
- Hardcoded: "Choose your username" copy, Trophy icon, helper text "3–20 chars · letters, numbers, underscores only".

---

## Basic Components (used across pages / repeated instances)

### Button
- Source: `components/ui/button.jsx`
- Category: basic
- Description: Core button primitive, 6 variants × 4 sizes, used on every page in this init.
- Extractable props: `variant` ("default"|"destructive"|"outline"|"secondary"|"ghost"|"link"), `size` ("default"|"sm"|"lg"|"icon"), `disabled` (boolean), `children`/label text.
- Hardcoded: nothing — this is already a fully generic primitive; only its Tailwind variant classes are fixed (that's the design system itself).

### Input
- Source: `components/ui/input.jsx`
- Category: basic
- Description: Styled text input, used in sign-in, AddNewInterview dialog, username modal, Header's inline username editor.
- Extractable props: `type`, `placeholder`, `value`, `disabled`.
- Hardcoded: none beyond base Tailwind styling.

### Textarea
- Source: `components/ui/textarea.jsx`
- Category: basic
- Description: Styled multiline input, used in AddNewInterview dialog ("Tech Stack / Description" field).
- Extractable props: `placeholder`, `value`, `rows`, `disabled`.
- Hardcoded: none.

### Dialog (modal)
- Source: `components/ui/dialog.jsx`
- Category: basic
- Description: Centered modal primitive (Radix), used by `AddNewInterview` for the "Set up your interview" form.
- Extractable props: `open` (boolean, controlled)
- Hardcoded: overlay opacity/blur, close-button X icon + position, animation classes.

### AlertDialog (confirmation modal)
- Source: `components/ui/alert-dialog.jsx`
- Category: basic
- Description: Confirmation dialog primitive (Radix), used by `InterviewCard` for the "Delete interview?" destructive confirmation, and by the interview-session exit flow.
- Extractable props: `open` (boolean, controlled)
- Hardcoded: overlay/animation classes; action button text ("Delete"/"Cancel") is set by each caller, not the primitive itself.

### ThemeToggle
- Source: `components/theme-toggle.jsx`
- Category: basic
- Description: Sun/Moon icon button that flips light/dark mode; lives inside `Header`.
- Extractable props: none (reads `next-themes` context internally) — for a static preview, expose `theme` ("light"|"dark") to pick the displayed icon.
- Hardcoded: icon choice logic, `rounded-full` styling.

### FeatureCard (landing — repeated 6×)
- Source: `app/page.js` (local function `FeatureCard`, lines ~447-473)
- Category: basic (card pattern)
- Description: Fake "code file" window-chrome card used in the landing page's Features grid — icon, filename label, title, description.
- Extractable props: `icon` (component reference), `file` (string, e.g. "mock-interview.ts"), `title` (string), `desc` (string), `index` (number, for stagger-entrance delay).
- Hardcoded: window-chrome 3-dot decoration, icon background treatment, hover border-glow transition, entrance animation timing.

### InterviewCard (dashboard — repeated per list item)
- Source: `app/dashboard/_components/InterviewCard.jsx`
- Category: basic (card pattern)
- Description: Mock/resume interview list-item card — role, experience badge, created date, "View Feedback"/"Practice" actions, delete via `AlertDialog`.
- Extractable props: `jobPosition` (string), `jobexperience` (string/number), `createdAt` (string), `mockId` (string, drives nav hrefs).
- Hardcoded: 3D tilt-on-hover mouse-tracking logic, shimmer sweep effect, all icon choices (Briefcase, CalendarDays, ChevronRight, Trash2), delete confirmation copy.

### LiveSessionCard (dashboard — repeated per list item)
- Source: `app/dashboard/_components/LiveSessionCard.jsx`
- Category: basic (card pattern)
- Description: Live-interview session list-item card — role, experience, exchange count, debrief score/band (color-coded), "View Debrief" action.
- Extractable props: `role` (string), `experience` (string/number), `createdAt` (string), `exchangeCount` (number), `debrief.score` (number), `debrief.overallBand` (string: excellent/good/average/poor — drives `bandColor()`), `mockId` (string).
- Hardcoded: same 3D tilt-on-hover + shimmer treatment as `InterviewCard`, `bandColor()` mapping (excellent=#10b981, good=#3b82f6, average=#f59e0b, else #ef4444).

### "New Interview" action tiles (dashboard — 3 near-identical variants)
- Sources: `app/dashboard/_components/LiveInterviewCard.jsx`, `app/dashboard/_components/ResumeInterviewCard.jsx`, `app/dashboard/_components/JDPrepCard.jsx` (plus `AddNewInterview.jsx`'s trigger tile, which additionally opens a `Dialog`)
- Category: basic (card pattern)
- Description: Dashed-border square CTA tiles in the "Start Interview" grid — icon in a pulsing ring, title, subtitle, click-to-navigate (or click-to-open-dialog for `AddNewInterview`).
- Extractable props: `icon` (component reference), `title` (string), `subtitle` (string), `href`/`onClick` target, `accentColor` (the hover/pulse tint — primary/emerald/violet/blue per tile).
- Hardcoded: pulsing-ring animation, hover border/background transition, per-tile icon and copy (New Interview / Live Interview / Resume Interview / JD Interview Prep).

### StreakWidget (dashboard, single-instance but composed of reusable stat-tile pattern)
- Source: `app/dashboard/_components/StreakWidget.jsx`
- Category: basic (stat-tile pattern within a layout section)
- Description: 3-tile stat row (day streak / weekly goal with progress bar + adjuster / total sessions) plus a dismissible nudge banner.
- Extractable props: `streak` (number), `weekSessions` (number), `goal` (number, adjustable 1–14), `totalSessions` (number), `lastSessionDaysAgo` (number|null).
- Hardcoded: nudge banner copy, goal `localStorage` persistence key, flame/target icon choices, color thresholds (streak>0 orange, goalMet emerald).
