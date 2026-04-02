import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const groqModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
});

const outputParser = new StringOutputParser();

/**
 * Run a single-turn prompt through Groq via LangChain.
 * Returns the raw string response.
 */
export async function runPrompt(userMessage) {
  const prompt = ChatPromptTemplate.fromMessages([
    ["human", "{input}"],
  ]);

  const chain = prompt.pipe(groqModel).pipe(outputParser);
  return chain.invoke({ input: userMessage });
}
