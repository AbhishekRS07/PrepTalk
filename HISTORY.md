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
