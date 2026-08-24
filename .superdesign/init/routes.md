# routes.md — Route Map

Routing: Next.js 15 App Router (file-based, no router config file — routes are defined by the `app/` directory tree). No central `routes.ts`/`router/index.ts` exists in this repo.

Route groups:
- `app/(auth)/` — auth pages, no `layout.jsx` of its own (inherits root `app/layout.js` only). The `(auth)` segment is not part of the URL.
- `app/dashboard/` — authenticated app section, wrapped by `app/dashboard/layout.jsx` (sticky Header + UsernameModal + centered `<main>`).
- `app/api/` — API route handlers (`route.js`), not UI pages.

---

## UI Pages

| URL | File | Layout | Description |
|---|---|---|---|
| `/` | `app/page.js` | root only | **Landing page.** Deep-dived — see `pages.md`. Terminal/dark-themed marketing page: navbar, animated hero, tech marquee, features grid, roadmap spotlight, "how it works" steps, footer. |
| `/sign-in` | `app/(auth)/sign-in/[[...sign-in]]/page.jsx` | root only | **Sign-in page.** Deep-dived — see `pages.md`. Split-panel layout: left brand/gradient panel (desktop only), right form panel with Google OAuth + email/password sign-in via Supabase. |
| `/sign-up` | `app/(auth)/sign-up/[[...sign-up]]/page.jsx` | root only | Sign-up page. Same split-panel visual pattern as sign-in (gradient left panel + form), Google OAuth + email/password signup via Supabase, `useState` for email/password/loading/success. |
| `/dashboard` | `app/dashboard/page.jsx` | `app/dashboard/layout.jsx` | **Dashboard home.** Deep-dived — see `pages.md`. Welcome header, `StreakWidget`, 4 "start interview" cards (Mock/Live/Resume/JD-prep), tabbed history (Mock/Live/Resume) with animated tab switching. |
| `/dashboard/analytics` | `app/dashboard/analytics/page.jsx` | dashboard | Performance analytics — line/bar charts (Recharts) of scores over time, trend indicators, category breakdowns. |
| `/dashboard/behavioral` | `app/dashboard/behavioral/page.jsx` | dashboard | Behavioral interview coach — category picker (leadership, conflict, failure, etc.) for STAR-style practice questions with AI feedback. |
| `/dashboard/how` | `app/dashboard/how/page.jsx` | dashboard | Static "how it works" explainer — numbered steps per feature (Mock Interview, Live AI, Resume-based, DSA, Roadmap, ATS). |
| `/dashboard/interview/[interviewId]` | `app/dashboard/interview/[interviewId]/page.jsx` | dashboard | Pre-interview screen — webcam permission toggle, prep tips, "start" CTA. |
| `/dashboard/interview/[interviewId]/start` | `app/dashboard/interview/[interviewId]/start/page.jsx` | dashboard | Active mock-interview session — question navigation (`_components/QuestionsSection`), answer recording (`_components/RecordAns`), exit confirmation via `AlertDialog`. |
| `/dashboard/interview/[interviewId]/feedback` | `app/dashboard/interview/[interviewId]/feedback/page.jsx` | dashboard | Post-interview feedback/debrief — per-question ratings, overall score, share link (copy/share icons). |
| `/dashboard/interviews` | `app/dashboard/interviews/page.jsx` | dashboard | Interview tracker — CRUD list of real-world upcoming/past interview rounds (technical/system design/behavioral/DSA/phone/final), with status and notes. |
| `/dashboard/jd-prep` | `app/dashboard/jd-prep/page.jsx` | dashboard | JD-based interview prep — paste a job description / company, AI researches and generates targeted questions; supports bookmarking, PDF resume upload (`unpdf`). |
| `/dashboard/journal` | `app/dashboard/journal/page.jsx` | dashboard | Interview journal — freeform log of past interview experiences/rounds with editable entries. |
| `/dashboard/leaderboard` | `app/dashboard/leaderboard/page.jsx` | dashboard | Public leaderboard — ranked users by score/streak with medal icons for top 3. |
| `/dashboard/live-interview` | `app/dashboard/live-interview/page.jsx` | dashboard | Live AI interviewer setup — configure role/experience before starting a real-time conversational session. |
| `/dashboard/live-interview/[mockId]` | `app/dashboard/live-interview/[mockId]/page.jsx` | dashboard | Live conversational interview session — chat-style turn-taking, mic/TTS controls, live scoring/feedback per turn. |
| `/dashboard/questions` | `app/dashboard/questions/page.jsx` | dashboard | DSA practice — topic/difficulty picker, Monaco-based code editor (`@monaco-editor/react`), AI-generated coding challenges with run/execute and an AI chat tab. |
| `/dashboard/resume` | `app/dashboard/resume/page.jsx` | dashboard | Resume ATS analyzer — upload resume, get ATS score ring, keyword gaps, section feedback, priority action plan; optional JD-match mode. |
| `/dashboard/resume-interview` | `app/dashboard/resume-interview/page.jsx` | dashboard | Resume-based interview setup — drag/drop resume upload, job role/experience inputs, generates resume-grounded questions. |
| `/dashboard/roadmap` | `app/dashboard/roadmap/page.jsx` | dashboard | AI learning roadmap — milestone list with completion tracking, confirm-modal for resets, `MilestoneCompletionEffect` celebration on completion, deep-links into other PrepTalk features. |
| `/dashboard/settings` | `app/dashboard/settings/page.jsx` | dashboard | Account settings — email digest / notification toggles. |
| `/dashboard/upgrade` | `app/dashboard/upgrade/page.jsx` | dashboard | Pricing/plans page — Free vs paid tier comparison cards with feature lists. |
| `/share/[token]` | `app/share/[token]/page.jsx` | root only (no dashboard chrome) | Public, unauthenticated read-only view of a shared interview feedback/debrief via token link. |

---

## API Routes (handlers only — not deep-dived, listed for completeness)

All under `app/api/**/route.js`:

```
app/api/analytics/route.js
app/api/answer/[mockId]/route.js
app/api/answer/save/route.js
app/api/behavioral/feedback/route.js
app/api/behavioral/generate/route.js
app/api/bookmarks/route.js
app/api/challenges/generate/route.js
app/api/challenges/run/route.js
app/api/email/digest/route.js
app/api/email/unsubscribe/route.js
app/api/interview/[mockId]/route.js
app/api/interview/converse/route.js
app/api/interview/generate/route.js
app/api/interviews/route.js
app/api/jd-prep/research/route.js
app/api/journal/route.js
app/api/leaderboard/route.js
app/api/live-interview/list/route.js
app/api/live-interview/save/route.js
app/api/live-interview/session/route.js
app/api/profile/route.js
app/api/questions/generate/route.js
app/api/resume/analyze/route.js
app/api/resume/generate/route.js
app/api/resume/save/route.js
app/api/roadmap/generate/route.js
app/api/roadmap/route.js
app/api/share/[token]/route.js
app/api/share/route.js
app/api/streak/route.js
app/api/upcoming-interviews/route.js
```

These back the UI pages above (interview generation/CRUD, live-interview session state, resume analysis, roadmap generation, leaderboard/streak/analytics aggregation, sharing, email digest). Out of scope for UI redesign context.
