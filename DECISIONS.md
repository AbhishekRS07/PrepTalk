# Decisions

Architectural and design decisions, with rationale, in the order they were made.

## 2026-08-24 — LLM provider: stay on Groq (`openai/gpt-oss-120b`), not Gemini

**Context:** The app's AI features (mock interview generation, resume analysis, roadmap,
coding challenges, behavioral prep, JD-prep, live interview conversation) all ran on
Groq's `llama-3.3-70b-versatile`, which Groq deprecated on 2026-08-16 — every AI feature
started failing with `model_not_found`.

**Decision:** Migrated to `openai/gpt-oss-120b` on Groq (see `lib/langchain.js`), not to
another provider.

**Why:**
- Evaluated switching providers entirely to escape Groq's 8,000 tokens/minute free-tier
  cap (`x-ratelimit-limit-tokens` header, confirmed live). Candidates researched: Cerebras,
  Google Gemini, SambaNova, OpenRouter, Kimi/Moonshot.
- Kimi has no standing free API tier (requires a $1 minimum recharge) — ruled out.
- SambaNova (20 requests/day) and OpenRouter free tier (50 requests/day) both cap total
  daily *requests* far too low for real usage, despite decent per-request token budgets.
- Google Gemini looked strong on paper (blog posts cited 250K-1M TPM for "Gemini 2.5
  Flash") but that model is deprecated for new API keys/projects. Live-testing the user's
  actual new key against current models (`gemini-flash-latest` → `gemini-3.7-flash`)
  produced a real `429 RESOURCE_EXHAUSTED` after a handful of calls: free-tier quota for
  a fresh project is **20 requests/day per model** — confirmed via the error body's
  `quotaValue`. Worse than the options already rejected.
- Cerebras serves the same `gpt-oss-120b` model with a better TPM budget (30K vs Groq's
  8K) but only 5 requests/minute (vs Groq's 1000) — would throttle the live interview
  conversation feature (one request per turn) worse than Groq does.
- Net result: no evaluated alternative was a clear win once verified empirically against
  the user's own account, several looked good only on stale/aggregated blog data. Groq,
  once tuned (see below), passed a full feature smoke test (`scripts/smoke-test.mjs`)
  end-to-end.

**How to apply:** If Groq's TPM ceiling becomes a real problem under actual usage (not
just aggressive back-to-back testing), the next things to check before switching provider
again: (1) whether Groq's paid Dev Tier removes the cap, (2) re-check Gemini's quota after
this project has accrued more usage history (Google sometimes raises fresh-project limits
over time), (3) re-verify any candidate's real limits against a live key before assuming
blog-reported numbers are current — they were wrong twice in this investigation.

## 2026-08-24 — Split model config: `getModel()` vs `getLiveModel()`

**Context:** `gpt-oss-120b` is a reasoning model — it spends completion tokens "thinking"
before answering. Two different usage patterns in the app want different tradeoffs.

**Decision:** `lib/langchain.js` exports two singletons: `getModel()` (default reasoning,
`maxTokens: 16000`) for one-shot generation where accuracy matters more than speed, and
`getLiveModel()` (`reasoningEffort: "low"`, `maxTokens: 2048`) for the live interview
conversation (`app/api/interview/converse/route.js`), where per-turn latency matters more
than maximum "thinking" depth.

**Why:** Live-tested: default reasoning effort used 79 of 110 completion tokens on a
short interview-turn-style prompt (~0.83s); `reasoning_effort: "low"` cut that to 12 of
51 tokens (~0.64s) with no visible quality loss. The interview debrief (scored once, at
the end of a session) stays on `getModel()` since it's not latency-sensitive.

**How to apply:** Any new route calling the model directly (not through `runPrompt`)
should pick `getModel()` for one-shot/accuracy-sensitive work or `getLiveModel()` for
real-time/turn-by-turn work, matching this split rather than adding a third variant.
