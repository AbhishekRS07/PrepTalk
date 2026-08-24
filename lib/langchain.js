import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

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
      // Groq's un-set default is too low for that; give it real headroom.
      maxTokens: 16000,
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
 * Expose the raw ChatGroq instances for routes that need multi-turn or custom temperature.
 */
export { getModel, getLiveModel };
