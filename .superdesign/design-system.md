# PrepTalk — Design System

## Product context

PrepTalk is an AI-powered interview-prep product: mock interviews (behavioral + technical), resume analysis, a personalized roadmap, coding challenges, and progress tracking (streaks, leaderboard, journal). The landing page (`/`) is the public marketing entry point; everything past it lives behind `/dashboard`.

Primary landing-page JTBD: convince a job-seeker in under one scroll that this is a serious, technically credible AI interview coach (not a generic SaaS AI wrapper), then push them to "Get Started" → `/dashboard`.

## Visual direction for the landing page (LOCKED — refine, do not replace)

The landing page runs its own **permanently-dark "terminal / hacker" aesthetic**, intentionally decoupled from the app-wide light/dark shadcn theme used everywhere past the landing page. This is the product's strongest piece of brand differentiation (fake code-file feature cards, a simulated "session.log" terminal panel with live AI Q&A, monospace type, a signal-green accent) and MUST be preserved. Redesign work here means: sharper hierarchy, more confident composition, better rhythm/spacing, more polish and distinctiveness — NOT a new visual language, NOT switching to a generic light SaaS look, NOT introducing decorative gradients/shadows outside this palette.

### Landing-page palette (`.pt-landing` scope — fixed dark, hex)

| Token | Value | Role |
|---|---|---|
| `--pt-ink` | `#0a0d0c` | page background |
| `--pt-panel` | `#121615` | card/panel background |
| `--pt-line` | `#23282a` | borders/dividers |
| `--pt-chalk` | `#edeee7` | primary text |
| `--pt-mist` | `#8b958e` | secondary/muted text |
| `--pt-signal` | `#39f2a0` | primary accent — CTAs, highlights, "live" indicators |
| `--pt-ember` | `#ff7a4d` | secondary accent, used sparingly (e.g. "AI — follow-up" label) |

Use ONLY these seven tokens for landing-page surfaces/text/accents. Do not introduce new hues.

### Fonts (landing page)

- `IBM Plex Mono` (`.pt-mono`) — headings, nav, labels, code-like UI, the terminal panel.
- `IBM Plex Sans` (`.pt-sans`) — body copy.
No other typefaces on this page. No serif, no decorative/display fonts.

### Landing-page motifs to keep and can extend

- Fake "code file" cards (feature grid) — monospace file-header chrome, syntax-like coloring using only the palette above.
- "session.log" fake-terminal panel with simulated AI Q&A + a score chip — this is the page's signature visual; a redesign should make it more prominent/confident, not remove it.
- Blinking terminal cursor after the "PrepTalk_" wordmark (`.pt-cursor-blink`).
- Audio-waveform bars for a "listening…" state (`.pt-wave-bar`).
- Infinite-scroll marquee of tech/skill keywords between hero and features.
- `--pt-signal` green used for CTAs, live indicators, and score/success states; `--pt-ember` orange reserved for one sparse callout (AI follow-up label) — don't rebalance these into equal usage.

### Layout facts to preserve

- Fixed top `Navbar`: logo/wordmark + anchor links + sign-in / get-started actions.
- Sections in order: `Hero` (scroll-parallax, word-cycling headline, stat cards, session.log panel) → `MarqueeBand` → `Features` (6 fake-code-file cards) → `RoadmapSpotlight` (two-column: checklist + mock roadmap progress card with milestones) → `HowItWorks` (3 numbered steps + second session.log recap panel + final CTA) → `Footer`.
- All CTAs route to `/dashboard`. No auth-gated content, no conditional rendering — fully static marketing page.
- Radius/spacing/breakpoints follow the app-wide Tailwind defaults (`--radius: 0.75rem`; standard `sm/md/lg/xl/2xl` breakpoints; `2xl` container capped at 1400px, centered, `2rem` padding) even though the color palette is scoped separately.

### Shared component vocabulary available to reuse

`components/ui/button.jsx` (cva-based variants) is the only shared primitive the landing page currently uses. `tailwind-merge` + `clsx` via `cn()` for className composition. `tailwindcss-animate` for enter/exit animation utilities if new interactive elements are added.

## Out of scope for this design system file

The app-wide HSL/shadcn theme (dashboard, auth, all non-landing pages) is a **separate, unrelated theme** — do not blend it into the landing page, and do not use this file to redesign those pages.
