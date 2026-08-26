import { ChatGroq } from "@langchain/groq";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { cleanJson } from "@/lib/utils";

// Singleton — Next.js module caching keeps this alive across requests in the same worker.
// Lazily initialised so the build doesn't fail when the relevant API key is absent.
//
// Note: Gemini's free tier was evaluated as an alternative (see project notes) but its
// per-model daily quota on a fresh API key/project turned out to be just 20 requests/day
// — confirmed via a live 429 RESOURCE_EXHAUSTED response, not the much higher figures
// blog posts report for older, now-deprecated-for-new-users Gemini models. Not viable.
//
// Split by output size, not just "live vs one-shot" — a live audit of every AI route
// found Mistral's free tier has wildly variable latency on LARGE structured outputs
// (DSA challenge generation: 115s; JD-prep multi-company synthesis: >300s, never
// completed) despite being comfortably fast on small ones (1.6-5.5s). Since this app has
// no `maxDuration` override anywhere, it runs on Vercel's default function timeout, so a
// 115s+ generation would get killed regardless of whether it eventually succeeds. So:
// - getModel() (Mistral) — small/fast "low effort" calls: scoring, short JSON extraction,
//   single-question generation. Also fixes the original bug (see getBigModel below).
// - getBigModel() (Groq) — large structured-output generations, where Groq's proven,
//   consistent inference speed matters more than its shared TPM ceiling.
let _model = null;
function getModel() {
  if (!_model) {
    _model = new ChatMistralAI({
      apiKey: process.env.MISTRAL_API_KEY,
      model: "mistral-medium-2505",
      temperature: 0.7,
      maxTokens: 5500,
    });
  }
  return _model;
}

// Groq's gpt-oss-120b free tier hard-caps at 8,000 tokens/minute *combined across every
// AI feature in the app* — confirmed live: the resume analyzer alone (~2,600
// tokens/request) tripped a 429 on a second back-to-back request within the same minute.
// That's why the resume analyzer specifically detects rate-limit errors and surfaces a
// clear retry message (see app/api/resume/analyze/route.js) rather than a generic crash
// — moving every large-output route here reintroduces some of that shared-budget risk,
// but it's the known, consistent, previously-working trade-off, unlike Mistral's latency
// variance on the same class of prompts.
let _bigModel = null;
function getBigModel() {
  if (!_bigModel) {
    _bigModel = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      maxTokens: 5500,
    });
  }
  return _bigModel;
}

// Lower reasoning effort for latency-sensitive, turn-by-turn use (live interview
// conversation) — trades some "thinking" depth for faster replies.
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
 * Run a single-turn prompt via LangChain. Defaults to the small/fast model (Mistral);
 * pass `getBigModel()` explicitly for large structured-output generations.
 */
export async function runPrompt(userMessage, model = getModel()) {
  const prompt = ChatPromptTemplate.fromMessages([["human", "{input}"]]);
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  return chain.invoke({ input: userMessage });
}

/**
 * Run a prompt and parse the reply as JSON. Reasoning models occasionally emit
 * near-valid-but-malformed JSON (a stray comma, an unescaped quote) — confirmed live on
 * Groq's gpt-oss-120b, identical prompt succeeded on retry. Since cleanJson's
 * fence/boundary stripping can't fix actual malformation, retry the generation itself
 * once before giving up.
 */
export async function runPromptJSON(prompt, shape, model = getModel()) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await runPrompt(prompt, model);
    try {
      return JSON.parse(cleanJson(raw, shape));
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * Expose the raw chat model instances for routes that need multi-turn or custom
 * temperature — getModel() is Mistral (small/fast calls), getBigModel() is Groq (large
 * structured-output generations), getLiveModel() is Groq (live interview conversation).
 */
export { getModel, getBigModel, getLiveModel };
