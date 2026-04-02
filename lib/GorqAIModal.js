// Server-side only. Import from API routes, never from client components.
import { runPrompt } from "./langchain";

export const chatSession = {
  sendMessage: async (prompt) => {
    const text = await runPrompt(prompt);
    return {
      response: {
        text: () => text,
      },
    };
  },
};
