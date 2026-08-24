# pages.md — Component Dependency Trees

Scope: full, exhaustive dependency trees for the 3 pages prioritized for this init (per current design task — landing-page redesign — plus the two most structurally central other pages). Node_modules / external packages (`framer-motion`, `lucide-react`, `next/image`, `next/link`, `next/navigation`, `next/font/google`, `@supabase/ssr`, `@radix-ui/*`) are named inline but not traced further. All other routes are listed with one-line descriptions only in `routes.md`.

Every file below was opened and read in full (not guessed from import lines).

---

## / (Landing Page) — PRIMARY TARGET

Entry: `app/page.js` (782 lines, `"use client"`)

This page is **structurally self-contained**: every section (`Navbar`, `MarqueeBand`, `Hero`, `FeatureCard`, `Features`, `RoadmapSpotlight`, `HowItWorks`, `Footer`) is a **local function component defined inside `app/page.js` itself** — there are no separate section files to trace. The only real local dependency is the shared `Button` primitive.

Dependencies:
- `components/ui/button.jsx` (`Button`)
  - `lib/utils.js` (`cn`)
  - external: `@radix-ui/react-slot`, `class-variance-authority`

External-only imports (not traced, no local files): `next/navigation` (`useRouter`), `next/font/google` (`IBM_Plex_Mono`, `IBM_Plex_Sans` — loaded directly in this file, scoped via `--font-plex-mono`/`--font-plex-sans`, NOT the app-wide `--font-inter`), `framer-motion` (`motion`, `useScroll`, `useTransform`, `AnimatePresence`, `useReducedMotion`), `next/image`, `lucide-react` (`Brain`, `Mic`, `Code2`, `ArrowRight`, `ChevronRight`, `ChevronDown`, `FileText`, `MapPin`, `Check`, `ScanText`).

### Actual render structure (from reading the full file)

```
Home()  [default export]
├── router = useRouter(); handleGetStarted = () => router.push("/dashboard")
└── <div className="pt-landing ..."> (dark terminal theme root, applies plexMono/plexSans font vars)
    ├── <Navbar onGetStarted>          — fixed sticky top bar
    │     logo (Image "/logo.svg") + "PrepTalk_" wordmark (blinking cursor span)
    │     desktop links: #features, #how-it-works (anchor scroll, hidden on mobile)
    │     right: "sign in" (ghost Button) + "get started" (primary Button, ChevronRight icon)
    │
    ├── <Hero onGetStarted>            — min-h-screen, scroll-linked parallax (useScroll/useTransform)
    │     ambient blurred glow div
    │     LEFT column:
    │       - eyebrow text "// live practice, real signal"
    │       - H1 headline with word-cycling animated span (setInterval, 2.8s, AnimatePresence)
    │         cycles: interview / coding round / system design / tech screen / behavioral round
    │       - subhead paragraph
    │       - CTA row: "start practicing free" (primary) + "see how it works" (outline, scrolls to #how-it-works)
    │       - stats row: 3 stat cards (5+ questions / ∞ sessions / 100% free)
    │     RIGHT column: "signature element" — fake terminal/session window
    │       - window chrome (3 dots + "session.log" label + pulsing "live" badge)
    │       - simulated transcript: AI question → animated waveform "listening…" bars → user answer →
    │         inline score chip "8/10" → AI follow-up line
    │     scroll indicator at bottom (bouncing chevron)
    │
    ├── <MarqueeBand>                  — infinite horizontal auto-scroll strip (framer-motion x: 0%→-50%)
    │     20 tech/skill keyword pills (React, Node.js, System Design, TypeScript, AWS, Python, DSA,
    │     Behavioral, Frontend, Backend, Full Stack, DevOps, SQL, Go, Kubernetes, LeetCode,
    │     Spring Boot, GraphQL, Docker, Redis) — doubled array for seamless loop, edge fade gradients
    │
    ├── <Features id="features">       — py-32 section
    │     section eyebrow "// what's inside" + H2 "Six tools, one practice loop." + subhead
    │     3-col responsive grid of 6 <FeatureCard> (fake code-file window chrome + icon + title + desc):
    │       Brain/mock-interview.ts, Mic/live-interviewer.ts, FileText/resume-questions.ts,
    │       Code2/dsa-practice.ts, MapPin/roadmap.ts, ScanText/ats-analyzer.ts
    │
    ├── <RoadmapSpotlight onGetStarted> — 2-col section, border-top
    │     LEFT: eyebrow "// where to start" + H2 "Your personal learning roadmap" + copy +
    │           5-item checklist (Check icons) + "get my roadmap" CTA
    │     RIGHT: mock roadmap card — circular SVG progress ring (50%), target-role line,
    │           linear progress bar, 5 milestone rows (done/current/upcoming states, strike-through, tags)
    │
    ├── <HowItWorks id="how-it-works"> — py-32 section, border-top, subtle panel bg
    │     eyebrow "// the loop" + H2 "Three steps to interview-ready"
    │     3-col grid of numbered steps (01 Choose your format / 02 Practice like it's real / 03 Get your debrief)
    │     "session.log" recap panel: 4 timestamped log lines + "try it now — it's free" CTA
    │
    └── <Footer>                        — border-top
          logo + wordmark, copyright line (dynamic year), features/how-it-works anchor links
```

All CTAs (`onGetStarted`) route to `/dashboard` via `router.push`. No conditional/auth-gated rendering on this page — it's fully public/static content plus one router action.

---

## /sign-in (Sign In Page)

Entry: `app/(auth)/sign-in/[[...sign-in]]/page.jsx` (`"use client"`, catch-all optional route)

Dependencies:
- `components/ui/button.jsx` (`Button`)
  - `lib/utils.js` (`cn`)
- `components/ui/input.jsx` (`Input`)
  - `lib/utils.js` (`cn`)
- `utils/supabase/client.js` (`createClient`) — singleton Supabase browser client

External-only: `next/navigation` (`useRouter`), `next/image`, `next/link`, `lucide-react` (`LoaderCircle`).

### Actual render structure

```
SignInPage()
├── state: email, password, loading, googleLoading, error
├── handleEmailSignIn — supabase.auth.signInWithPassword → router.push("/dashboard") + refresh
├── handleGoogleSignIn — supabase.auth.signInWithOAuth({ provider: "google", redirectTo: .../auth/callback })
└── <div className="min-h-screen bg-background flex">
    ├── LEFT panel (hidden below lg) — .gradient-primary, two decorative blurred circles
    │     logo Link → "/", H2 "Practice makes perfect interviews.", supporting copy, copyright
    ├── RIGHT panel — centered form column
    │     mobile-only logo (hidden on lg)
    │     "Welcome back" heading + subtext
    │     Google sign-in Button (outline, Google "G" SVG icon inline, LoaderCircle while loading)
    │     "or" divider
    │     email/password <form>: Input (email) + Input (password) + inline error banner +
    │           submit Button (LoaderCircle while loading)
    │     footer link: "Don't have an account? Sign up" → /sign-up
```

Note: `app/(auth)/sign-up/[[...sign-up]]/page.jsx` follows the identical structural pattern (same split-panel layout, same component imports) — not deep-dived per scope, listed in `routes.md`.

---

## /dashboard (Dashboard Home Page)

Entry: `app/dashboard/page.jsx` (`"use client"`)
Layout wrapper (applies to this and every other `/dashboard/**` route): `app/dashboard/layout.jsx` — see `layouts.md`.

### Dependency tree — page body (`app/dashboard/page.jsx`)

- `app/dashboard/_components/AddNewInterview.jsx`
  - `components/ui/dialog.jsx` (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`)
    - `lib/utils.js` (`cn`)
    - external: `@radix-ui/react-dialog`
  - `components/ui/button.jsx` (`Button`)
    - `lib/utils.js` (`cn`)
  - `components/ui/input.jsx` (`Input`)
    - `lib/utils.js` (`cn`)
  - `components/ui/textarea.jsx` (`Textarea`)
    - `lib/utils.js` (`cn`)
  - `context/AuthContext.jsx` (`useAuth`)
    - `utils/supabase/client.js` (`createClient`)
  - external: `next/navigation` (`useRouter`), `framer-motion`, `lucide-react` (`LoaderCircle`, `Plus`, `Sparkles`)
- `app/dashboard/_components/LiveInterviewCard.jsx`
  - external only: `framer-motion`, `lucide-react` (`Mic`), `next/navigation`
- `app/dashboard/_components/ResumeInterviewCard.jsx`
  - external only: `framer-motion`, `lucide-react` (`FileText`), `next/navigation`
- `app/dashboard/_components/JDPrepCard.jsx`
  - external only: `framer-motion`, `next/navigation`, `lucide-react` (`Building2`)
- `app/dashboard/_components/InterviewList.jsx`
  - `context/AuthContext.jsx` (`useAuth`)
    - `utils/supabase/client.js`
  - `app/dashboard/_components/InterviewCard.jsx`
    - `components/ui/button.jsx` (`Button`)
      - `lib/utils.js`
    - `components/ui/alert-dialog.jsx` (`AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogTrigger`)
      - `lib/utils.js` (`cn`)
      - `components/ui/button.jsx` (`buttonVariants`)
      - external: `@radix-ui/react-alert-dialog`
    - external: `next/navigation`, `lucide-react` (`CalendarDays`, `Briefcase`, `ChevronRight`, `Trash2`), `framer-motion`
  - external: `framer-motion`, `lucide-react` (`Loader2`)
- `app/dashboard/_components/LiveInterviewList.jsx`
  - `context/AuthContext.jsx` (`useAuth`)
  - `app/dashboard/_components/LiveSessionCard.jsx` (+ named export `liveCardVariants`)
    - `components/ui/button.jsx` (`Button`)
      - `lib/utils.js`
    - external: `next/navigation`, `lucide-react` (`CalendarDays`, `Mic`, `ChevronRight`), `framer-motion`
  - `components/ui/button.jsx` (`Button`)
  - external: `framer-motion`, `lucide-react` (`Loader2`, `Mic`), `next/navigation`
- `app/dashboard/_components/StreakWidget.jsx`
  - `lib/utils.js` (`cn`)
  - external: `framer-motion`, `lucide-react` (`Flame`, `Target`, `ChevronUp`, `ChevronDown`, `X`, `Zap`), `next/link`
- `context/AuthContext.jsx` (`useAuth`)
  - `utils/supabase/client.js`
- `lib/utils.js` (`cn`)
- `lib/animations.js` (`containerVariants`, `lineVariants`, `sectionVariants` — shared framer-motion variant presets)

External-only at page level: `framer-motion` (`motion`, `AnimatePresence`), `lucide-react` (`BarChart3`, `Mic`, `FileText`).

### Dependency tree — layout wrapper (`app/dashboard/layout.jsx`, applies to every `/dashboard/**` route incl. this one)

- `app/dashboard/_components/Header.jsx`
  - `components/theme-toggle.jsx` (`ThemeToggle`)
    - `components/ui/button.jsx` (`Button`)
      - `lib/utils.js`
    - external: `next-themes`, `lucide-react` (`Moon`, `Sun`)
  - `lib/utils.js` (`cn`)
  - `context/AuthContext.jsx` (`useAuth`)
    - `utils/supabase/client.js`
  - `components/ui/button.jsx` (`Button`)
  - `components/ui/input.jsx` (`Input`)
  - external: `next/image`, `next/link`, `next/navigation` (`usePathname`, `useRouter`), `lucide-react` (`LogOut`, `Pencil`, `Loader2`, `CheckCircle2`, `Menu`, `X`, `MapPin`, `CalendarDays`, `BookOpen`, `Settings`, `Brain`, `FileText`), `framer-motion`
- `app/dashboard/_components/UsernameModal.jsx`
  - `context/AuthContext.jsx` (`useAuth`)
  - `components/ui/button.jsx` (`Button`)
  - `components/ui/input.jsx` (`Input`)
  - external: `framer-motion`, `lucide-react` (`Trophy`, `Loader2`, `CheckCircle2`)

### Also applies globally (root layout, `app/layout.js`, wraps `app/dashboard/layout.jsx` too)

- `components/theme-provider.jsx` (`ThemeProvider`)
- `context/AuthContext.jsx` (`AuthProvider`)
  - `utils/supabase/client.js`
- external: `sonner` (`Toaster`), `@next/third-parties/google` (`GoogleAnalytics`), `next/font/google` (`Inter`)

### Actual render structure (`app/dashboard/page.jsx`, read in full)

```
Dashboard()
├── activeTab state ("mock" | "live" | "resume")
├── firstName derived from user.user_metadata.full_name or email
└── <div className="space-y-10">
    ├── Header block — "Welcome back, {firstName} 👋" + "Dashboard" H1 + subtext (motion stagger-in)
    ├── <StreakWidget />                — streak/goal/total-sessions stat row + nudge banner
    ├── "Start Interview" section — 4-col grid:
    │     <AddNewInterview /> <LiveInterviewCard /> <ResumeInterviewCard /> <JDPrepCard />
    └── Tabbed history section
        ├── pill tab bar: Mock Interviews / Live Interviews / Resume Interviews (icons + active state)
        └── AnimatePresence-swapped content:
              mock   → <InterviewList filter="mock" />
              live   → <LiveInterviewList />
              resume → <InterviewList filter="resume" />
```
