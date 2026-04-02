import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

/**
 * Run a single-turn prompt through Groq via LangChain.
 * Client is initialized lazily at call time so build doesn't fail without env vars.
 */
export async function runPrompt(userMessage) {
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
  });

  const prompt = ChatPromptTemplate.fromMessages([["human", "{input}"]]);
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  return chain.invoke({ input: userMessage });
}
