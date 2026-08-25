# Known Issues

Known bugs, limitations, and tech debt. Newest entries at the bottom.

## Vercel domain is not stable across project recreation — breaks Supabase OAuth

**Symptom:** After deleting a Vercel deployment/project and creating a new one, Google
sign-in redirects to a `DEPLOYMENT_NOT_FOUND` 404 page instead of landing back in the
app, with a `?code=...` query param stuck in the URL.

**Root cause:** Vercel assigns a new random `*.vercel.app` slug (e.g.
`prep-talk-cyan` → `preptalk-drab`) whenever a project is deleted and recreated instead
of redeployed within the same project. The app itself builds the OAuth `redirectTo` URL
dynamically (`${window.location.origin}/auth/callback` — see
`app/(auth)/sign-in/[[...sign-in]]/page.jsx` and `sign-up/page.jsx`), so it's always
correct. But Supabase (Authentication → URL Configuration) only honors a `redirectTo`
that matches its **Redirect URLs allow-list**, and falls back to the **Site URL**
otherwise — appending the auth `code` to whatever that is. If the allow-list and Site
URL still reference the old, now-deleted domain, the OAuth callback lands on a dead
deployment.

**Fix applied (2026-08-25):** Updated the Supabase project's Site URL and added
`https://preptalk-drab.vercel.app/**` to the Redirect URLs allow-list
(`https://supabase.com/dashboard/project/ebrfjezfrlkozyzkzvxy/auth/url-configuration`).

**Until resolved permanently:** Every time the production Vercel domain changes, update
both the Site URL and Redirect URLs in Supabase to match, or the OAuth flow breaks
identically again.

**Recommended permanent fix (not yet done):** Attach a stable custom domain to the
Vercel project (e.g. via Vercel Domains) and point Supabase's Site URL / Redirect URLs
at that instead of the auto-generated `*.vercel.app` slug — and prefer redeploying
within the existing Vercel project rather than deleting and recreating it, since that's
what changes the slug in the first place.

## `utils/db.js` still creates its Postgres/Drizzle client at module scope

**Symptom:** None observed yet — `postgres(undefined, ...)` doesn't throw synchronously
(verified directly), so this hasn't crashed a build the way the Supabase and Tavily
clients did (see `HISTORY.md`, 2026-08-24 entries).

**Why it's still worth fixing:** It's the same eager-module-scope-client pattern that
caused two prior Vercel build crashes, just with a connection string that happens to
fail silently instead of throwing. A future change to the `postgres` package's
validation behavior, or a route that touches `db` in a way Next.js evaluates at build
time, could resurface the same failure mode. Lazy-init it (matching
`utils/supabase/server.js`'s pattern) as a preventive measure the next time this file is
touched.

## Interview Journal feature was completely broken — table didn't exist (RESOLVED 2026-08-25)

**Symptom:** The Journal page (`/dashboard/journal`) always showed "Your journal is
empty," even right after logging an entry. `add entry` silently did nothing useful.

**Root cause:** `app/api/journal/route.js` (GET/POST/PATCH/DELETE) all query a table
called `interview_journal`, which did not exist in the database at all — confirmed via
`information_schema.tables`: the `public` schema had exactly 7 tables (`bookmarks`,
`liveInterview`, `preptalk`, `profiles`, `roadmap`, `upcoming_interviews`,
`userAnswer`), and `interview_journal` wasn't one of them. Every request 500'd
server-side, but the frontend swallowed the error and rendered the empty state instead
of showing a real failure, which is why this had likely gone unnoticed.

**Fix applied (2026-08-25):** Created the table with RLS enabled and an owner-only
policy, matching the pattern used for the other fully-owned tables (`bookmarks`,
`roadmap`, `upcoming_interviews`). Verified live end-to-end through the actual app:
created an entry (`Stripe · SDE-2`), confirmed it listed correctly with stats
aggregation, then deleted it — create/read/delete all confirmed working (update uses
the identical owner-scoped pattern). Exact schema applied, for reference:

```
interview_journal
  id               uuid, PK
  email            text, not null   -- owner, matches auth.jwt() ->> 'email'
  company          text, not null
  role             text, not null
  interview_date   date, not null
  round_type       text, default 'technical'
  feeling          text, default 'okay'
  questions_asked  text, default ''
  how_it_went      text, default ''
  what_to_improve  text, default ''
  outcome          text, default 'waiting'
  created_at       timestamptz, default now()
  updated_at       timestamptz, default now()   -- route also sets this explicitly on PATCH
```

RLS policy (matching the `bookmarks`/`roadmap`/`upcoming_interviews` pattern):

```sql
alter table public.interview_journal enable row level security;

create policy "interview_journal_owner_all" on public.interview_journal
  for all
  to authenticated
  using (email = (select auth.jwt() ->> 'email'))
  with check (email = (select auth.jwt() ->> 'email'));
```
