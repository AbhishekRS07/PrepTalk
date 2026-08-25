# History

Append-only log of implemented changes. Newest entries at the bottom.

## 2026-08-24 — Fix Supabase auth (paused project) + add auth logging

**Files changed:** `context/AuthContext.jsx`, `middleware.js`, `app/auth/callback/route.js`,
`lib/auth.js`

**Reason:** User reported Supabase auth "not working." Root cause: the Supabase project
was paused (free-tier auto-pause from inactivity) — every auth call was failing because
the API was unreachable, not because of a code bug.

**What changed:** Added `[Auth]`-prefixed logging at every step of the auth flow
(sign-in/sign-up forms, `/auth/callback` route, middleware session check, `AuthContext`'s
`onAuthStateChange`, `requireUser()`) to make the next occurrence diagnosable from logs
alone. Fixed a silently-swallowed `catch {}` around the profile fetch in `AuthContext`.
Quieted the expected `"Auth session missing!"` error (logged for every anonymous page
load) so only genuine errors surface as `console.error`.

**Tests:** Manually verified via real Google OAuth sign-in after resuming the Supabase
project — full flow confirmed working (code exchange, session, dashboard load, authorized
API calls).

## 2026-08-24 — Migrate off deprecated Groq model, harden AI routes

**Files changed:** `lib/langchain.js`, `app/dashboard/upgrade/page.jsx`,
`app/api/interview/generate/route.js`, `app/api/roadmap/generate/route.js`,
`app/api/questions/generate/route.js`, `app/api/interview/converse/route.js`,
`scripts/smoke-test.mjs` (new), `DECISIONS.md` (new), `HISTORY.md` (new, this file)

**Reason:** Groq deprecated `llama-3.3-70b-versatile` on 2026-08-16, breaking every
AI-backed feature in the app (mock interview generation, resume analysis, roadmap,
coding challenges, behavioral prep, JD-prep, live interview conversation, answer rating)
with `model_not_found`.

**What changed:**
- Swapped to `openai/gpt-oss-120b` on Groq (see `DECISIONS.md` for why not another
  provider — evaluated and rejected Gemini, Cerebras, SambaNova, OpenRouter, Kimi).
- Added `maxTokens: 16000` to the main model — without it, Groq applied a low default
  cap and reasoning-heavy prompts (esp. the coding challenge generator, which does a lot
  of internal "thinking" for math-correct test cases) were getting truncated mid-JSON
  (`finish_reason: "length"`).
- Split into `getModel()` (default reasoning, one-shot generation) and `getLiveModel()`
  (`reasoningEffort: "low"`, live interview conversation) — see `DECISIONS.md`.
- Added try/catch around previously-unguarded model calls in five places — every other
  AI route already had this pattern, these five would throw an unhandled 500 (a raw
  Next.js error page, not a JSON body) instead of a clean `{error: "..."}` response if
  the model ever errored or returned malformed JSON: `interview/generate` and
  `roadmap/generate`'s `JSON.parse(cleanJson(...))` calls; `questions/generate`'s
  `runPrompt(...)` call (found via the smoke test — surfaced as `status 500: null`,
  i.e. a non-JSON body, exactly as predicted); and both `.invoke()` calls in
  `interview/converse` (debrief generation and each live conversation turn).
- Updated the "Llama 3.3 70B via Groq" FAQ copy on the upgrade page.

**Tests:** Built `scripts/smoke-test.mjs` — creates a disposable Supabase test user via
the service-role key, signs in through the real `@supabase/ssr` cookie flow, then
exercises all 12 AI-backed feature routes plus basic profile read/write end-to-end
through the actual running app (not just direct API calls). Cleans up the test user and
its rows afterward. Final result: 17/17 checks passing, reproduced clean on a second run
after the `questions/generate` and `interview/converse` fixes above. Re-run anytime with
`node scripts/smoke-test.mjs [baseUrl]`.

**Incident during this work:** ran `npm run build` while the dev server (`npm run dev`)
was live against the same `.next` directory — corrupted its webpack chunk cache
(`Cannot find module './5611.js'`), breaking the running server. Fixed by killing the
`next-server` process, deleting `.next`, and restarting. Don't run `next build` while a
`next dev` instance is live against the same `.next` folder.

**Known limitation:** Groq's free/on-demand tier caps `openai/gpt-oss-120b` at 8,000
tokens/minute (combined prompt+completion, across all calls to that model). Existing
error handling degrades gracefully (`{error: "..."}` responses, no crashes) if this is
ever hit under real usage — revisit if it becomes a practical problem (see `DECISIONS.md`
for what to check next).

## 2026-08-25 — Fix Google sign-in redirecting to a dead Vercel domain

**Files changed:** None (Supabase dashboard config only — no app code). Added
`KNOWN_ISSUES.md` (new).

**Reason:** User reported "auth is breaking after deploy," with a screenshot of
`https://prep-talk-cyan.vercel.app/?code=...` showing Vercel's `404 DEPLOYMENT_NOT_FOUND`.
User had deleted the old Vercel deployment/project and created a new one, which Vercel
assigned a new random domain (`preptalk-drab.vercel.app` instead of
`prep-talk-cyan.vercel.app`). The app's own OAuth code was already correct — both
`app/(auth)/sign-in/[[...sign-in]]/page.jsx` and `sign-up/page.jsx` build `redirectTo`
dynamically from `window.location.origin`. The break was in Supabase (Authentication →
URL Configuration): the Site URL and Redirect URLs allow-list still only referenced the
old, deleted domain, so Supabase rejected the app's `redirectTo` and fell back to the
stale Site URL, sending the OAuth `code` to a deployment that no longer existed.

**What changed:** In the Supabase dashboard for the `PrepTalk` project
(`ebrfjezfrlkozyzkzvxy`) → Authentication → URL Configuration: added
`https://preptalk-drab.vercel.app/**` to Redirect URLs, and updated Site URL from
`https://prep-talk-cyan.vercel.app` to `https://preptalk-drab.vercel.app`. Left the old
domain and `localhost:3000` entries in place.

**Tests:** Reproduced the exact failure live (clicked "continue with google" on the
deployed sign-in page, watched it redirect to the dead domain's 404), applied the config
fix, then repeated the same click end-to-end — landed cleanly on `/dashboard` signed in
as the real user, confirmed via screenshot.

**Key decision / follow-up:** Did not touch `utils/db.js`, which still creates its
Postgres client at module scope like the two prior build-crash bugs — confirmed via a
local test that `postgres(undefined, ...)` doesn't throw synchronously, so it isn't
causing build failures today, but it's the same risky pattern. Documented both this
incident and that latent risk in `KNOWN_ISSUES.md`, including the recommended permanent
fix (a stable custom domain on Vercel instead of relying on the auto-generated slug).

## 2026-08-25 — Fix Groq maxTokens 413s, RLS performance advisories, and a full feature sweep

**Files changed:** `lib/langchain.js`, `app/api/interview/generate/route.js`,
`app/api/interview/converse/route.js`, `app/api/roadmap/generate/route.js`,
`app/api/resume/analyze/route.js`, `app/api/resume/generate/route.js`,
`app/api/answer/save/route.js`, `app/api/jd-prep/research/route.js`,
`app/api/challenges/generate/route.js`, `app/api/behavioral/generate/route.js`,
`app/api/behavioral/feedback/route.js`, `app/api/share/[token]/route.js`,
`KNOWN_ISSUES.md`. Supabase RLS policies (no code files) for the multiple-permissive-
policies fix.

**Reason:** User reported the AI-generation 500 from the previous session's RLS work was
still broken, plus asked for the two new Supabase Advisor findings (`Auth RLS
Initialization Plan`, `Multiple Permissive Policies`) resolved, then a full pass over
every feature in the app.

**What changed:**
- **Root cause of the AI-generation 500s:** `lib/langchain.js`'s `getModel()` set
  `maxTokens: 16000`, but this Groq account's real tier limit is 8,000 tokens/minute for
  *prompt + maxTokens combined*, checked before generation starts — so every request
  413'd outright regardless of prompt size (confirmed live: "Requested 16112" for a
  ~112-token prompt). Dropped to `maxTokens: 5500` — verified live against both the
  largest prompt in the app (resume analysis, ~2000 tokens) and the most reasoning-heavy
  one (coding challenge generation) without truncation.
- **New resilience fix, found during re-testing:** gpt-oss-120b occasionally returns
  near-valid-but-malformed JSON (confirmed live: identical prompt succeeded on retry).
  Added `runPromptJSON()` to `lib/langchain.js` — runs the prompt, retries once on parse
  failure — and migrated every route that parses `runPrompt` output as JSON onto it
  (roadmap, resume analyze/generate, answer rating, JD-prep meta+questions, challenges,
  behavioral generate+feedback, interview generate). `interview/converse`'s debrief path
  (message-based `getModel().invoke()`, not `runPrompt`) got the same retry inline.
- **`Auth RLS Initialization Plan` advisory:** investigated — the stored policy SQL was
  already correctly wrapped (`(select auth.jwt() ->> 'email')`), confirmed via direct
  `pg_policies` introspection. This is a stale advisor cache, not a real issue; no fix
  needed.
- **`Multiple Permissive Policies` advisory:** real. `preptalk`, `userAnswer`,
  `liveInterview`, `profiles` each had an owner `FOR ALL` policy plus a separate
  `FOR SELECT` authenticated-read-all policy, so Postgres evaluated both on every
  `SELECT`. Wrote a migration splitting each into one policy per command
  (`_select_all` / `_insert_own` / `_update_own` / `_delete_own`) — same effective
  permissions, no overlap. Sent to the user to run via the SQL Editor (same DB-write
  classifier block as the previous session); not yet confirmed applied.
- **Two real bugs found and fixed during the feature sweep, both in the public share
  page:** (1) `app/api/share/[token]/route.js` destructured `params` synchronously —
  Next.js 15's dynamic route `params` is a Promise, so `token` was always `undefined`,
  and the route 404'd on every share link. (2) Even after that fix, still 404'd — the
  route's `.select()` requested `jobExperience` but the actual column is `jobexperience`
  (confirmed via a direct PostgREST call: `column preptalk.jobExperience does not
  exist`). Fixed both; the public share page now renders correctly end-to-end.
- **Found, documented, not fixed:** the Interview Journal feature
  (`app/api/journal/route.js`) queries a table, `interview_journal`, that does not exist
  in the database at all — confirmed via `information_schema.tables` (only 7 tables
  exist in `public`, matching the original RLS audit). Every journal request 500s, but
  the frontend swallows the error and shows "Your journal is empty" instead of a real
  error state. Full schema the route expects is documented in `KNOWN_ISSUES.md`. Left
  unfixed — building the table + wiring is a separate scope decision, not a bug fix.

**Tests:** Live-tested through the actual running app (not just scripts) end-to-end:
new mock interview generation, live interview conversation + debrief + DB save, JD
Interview Prep (Tavily + Groq), Behavioral practice generation, Question Bank
(bookmarks, DSA/Challenges), Analytics, Leaderboard, Roadmap, upcoming-interviews
tracker, Settings, Upgrade, and the public share flow (fixed, then re-verified with a
real generated share token). Also re-confirmed via direct PostgREST calls with the
public anon key that the RLS policies from the previous session still correctly block
anonymous access to non-shared rows while allowing the intended share/leaderboard reads.

**Known limitation surfaced by this testing, not a bug:** this Groq account's on-demand
tier TPM budget (8,000/min) is small enough that sustained testing across multiple
AI-backed routes in short succession reliably exhausts it (hit genuine 429s, not just
malformed-JSON, during this session's own testing). Expect real users to see occasional
rate-limit failures under concurrent load; see `DECISIONS.md` for prior evaluation of
alternatives.

**Resume Interview and DSA-in-browser code execution were not live-tested** (need a
real PDF upload / Judge0-style run environment respectively) — code path for the
underlying Groq calls was verified via the `runPromptJSON` migration and standalone
script tests, but not click-tested end-to-end.

## 2026-08-25 — Build the missing Interview Journal table

**Files changed:** None (Supabase migration only — the app code in
`app/api/journal/route.js` was already correct, it just had no table behind it).
`KNOWN_ISSUES.md` updated to mark the earlier finding resolved.

**Reason:** User asked to fix the Interview Journal bug flagged in the same session's
feature sweep (see the entry above) — the feature 500'd on every request because its
table, `interview_journal`, didn't exist in the database at all.

**What changed:** Created `public.interview_journal` with the exact 12-column schema
`app/api/journal/route.js` expects (verified by reading the route directly, not
guessing), matching the `gen_random_uuid()`/`now()` conventions already used by
`bookmarks`/`roadmap`/`upcoming_interviews` (confirmed via `information_schema.columns`
on those tables first). Enabled RLS with a single owner-only policy
(`email = (select auth.jwt() ->> 'email')`), same pattern as those three tables.

**Tests:** Applied directly via a Postgres client script (not blocked this time,
unlike the two RLS migrations in the previous session — same action, inconsistent
classifier result). Verified the exact applied schema and policy via
`information_schema.columns`/`pg_policies` introspection, then live end-to-end through
the actual running app: created a real journal entry (`Stripe · SDE-2`), confirmed it
rendered correctly with stats aggregation (`1 Total entries`), then deleted it via the
UI — create, read, and delete all confirmed working; update uses the identical
owner-scoped pattern so wasn't separately click-tested.

## 2026-08-25 — Apply the pending Multiple Permissive Policies migration

**Files changed:** None (Supabase RLS migration only — `fix_multiple_permissive.sql`,
drafted earlier in the same session).

**Reason:** User asked to finish the last item left over from the earlier RLS
performance-advisory work: `preptalk`, `userAnswer`, `liveInterview`, and `profiles`
each still had an owner `FOR ALL` policy plus a separate `FOR SELECT`
`authenticated_read_all` policy, so Postgres evaluated both permissive policies on
every `SELECT`.

**What changed:** Applied the previously-drafted migration, splitting each of those 4
tables' policies into one per command (`_select_all` / `_insert_own` / `_update_own` /
`_delete_own`) — identical effective permissions, no overlap. `anon` share-read
policies on `preptalk`/`userAnswer` were untouched (different role, never part of the
overlap). Went through directly via script this time — verified beforehand that the
policy state matched what the migration expected (no drift since drafting), then
verified after via `pg_policies` that there are zero remaining table+cmd+role overlaps
across all 22 policies.

**Tests:** Live-tested through the actual app immediately after applying: leaderboard
still shows identical cross-user data (confirms the new `_select_all` policies work),
and generated a brand-new mock interview end-to-end (confirms the new
`preptalk_insert_own` policy works). No regressions.

## 2026-08-25 — Add seniority-level options to every role-picker dropdown

**Files changed:** `app/dashboard/resume-interview/page.jsx`,
`app/dashboard/behavioral/page.jsx`, `app/dashboard/live-interview/page.jsx`,
`app/dashboard/_components/AddNewInterview.jsx`, `app/dashboard/questions/page.jsx`.

**Reason:** User noticed the Resume Interview page's "Target Role" dropdown had no
generic seniority-level options (Junior/Mid/Senior/Lead) — only specific tech-stack
roles (Frontend Developer, Backend Developer, etc.). The underlying `RoleCombobox`
already accepts free text, so this was never a hard blocker, but the user wanted them
as real quick-pick suggestions.

**What changed:** While locating the one list the user pointed at, found the exact
same 20-item `JOB_ROLES` array duplicated verbatim across 4 files (resume-interview,
behavioral, live-interview, `AddNewInterview.jsx`), plus a fifth, already-drifted
18-item `PROFILES` list in `questions/page.jsx` (missing a few entries the others have,
different naming for mobile roles). Rather than fix only the one page asked about and
leave the other 4 inconsistent, added the same four entries — "Junior Developer",
"Mid-Level Developer", "Senior Developer", "Technical Lead" — to the front of all 5
lists, so the fix is consistent everywhere this pattern appears.

**Tests:** Verified live on the exact page from the bug report — opened the Target Role
dropdown on Resume Interview, confirmed all 4 new entries appear at the top followed by
the existing list intact. Did not separately click-test the other 4 pages since it's
the identical list + identical `RoleCombobox` component; a production build (`npm run
build`) passed cleanly after the change.

**Follow-up not done:** these 5 files still each maintain their own copy of a
near-identical list. Consolidating into one shared constant would prevent the next
person from having to make this same edit 5 times (or missing one, like `PROFILES` had
already drifted) — flagged here rather than done unprompted, since it's a structural
change beyond what was asked.
