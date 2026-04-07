import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Singleton — Next.js module caching keeps this alive across requests in the same worker.
// Lazily initialised so the build doesn't fail when GROQ_API_KEY is absent.
let _model = null;
function getModel() {
  if (!_model) {
    _model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });
  }
  return _model;
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
 * Expose the raw ChatGroq instance for routes that need multi-turn or custom temperature.
 */
export { getModel };
