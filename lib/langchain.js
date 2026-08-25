import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { cleanJson } from "@/lib/utils";

// Singleton — Next.js module caching keeps this alive across requests in the same worker.
// Lazily initialised so the build doesn't fail when GROQ_API_KEY is absent.
//
// Note: Gemini's free tier was evaluated as an alternative (see project notes) but its
// per-model daily quota on a fresh API key/project turned out to be just 20 requests/day
// — confirmed via a live 429 RESOURCE_EXHAUSTED response, not the much higher figures
// blog posts report for older, now-deprecated-for-new-users Gemini models. Not viable.
// Staying on Groq, which is the only option verified end-to-end in this app.
let _model = null;
function getModel() {
  if (!_model) {
    _model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      // gpt-oss-120b is a reasoning model — it spends completion tokens "thinking"
      // before writing output, and on reasoning-heavy prompts (e.g. math-correct test
      // cases) that can eat most of a small default cap, truncating the JSON mid-object.
      // Give it real headroom — but this account's Groq tier hard-caps at 8,000 tokens
      // per minute for *prompt + maxTokens combined*, checked before generation even
      // starts. 16000 alone exceeded that, so every request 413'd outright regardless of
      // prompt size (confirmed live: "Requested 16112" for a ~112-token prompt). 5500
      // leaves ~2500 tokens of prompt headroom — enough for the largest prompt in the app
      // (resume analysis, ~2000 tokens) — and was verified live against both that and the
      // reasoning-heavy coding-challenge generator without truncation.
      maxTokens: 5500,
    });
  }
  return _model;
}

// Lower reasoning effort for latency-sensitive, turn-by-turn use (live interview
// conversation) — trades some "thinking" depth for faster replies. Keep the default
// (unset) reasoning effort on `getModel()` for one-shot tasks where accuracy matters
// more than latency (JSON extraction, resume analysis, debrief scoring, etc).
let _liveModel = null;
function getLiveModel() {
  if (!_liveModel) {
    _liveModel = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      reasoningEffort: "low",
      maxTokens: 2048,
    });
  }
  return _liveModel;
}

/**
 * Run a single-turn prompt through Groq via LangChain.
 */
export async function runPrompt(userMessage) {
  const prompt = ChatPromptTemplate.fromMessages([["human", "{input}"]]);
  const chain = prompt.pipe(getModel()).pipe(new StringOutputParser());
  return chain.invoke({ input: userMessage });
}

/**
 * Run a prompt and parse the reply as JSON. gpt-oss-120b occasionally emits
 * near-valid-but-malformed JSON (a stray comma, an unescaped quote) — confirmed live,
 * identical prompt succeeded on retry. Since cleanJson's fence/boundary stripping can't
 * fix actual malformation, retry the generation itself once before giving up.
 */
export async function runPromptJSON(prompt, shape) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await runPrompt(prompt);
    try {
      return JSON.parse(cleanJson(raw, shape));
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * Expose the raw ChatGroq instances for routes that need multi-turn or custom temperature.
 */
export { getModel, getLiveModel };
