import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const chatSession = {
  sendMessage: async (prompt) => {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const text = completion.choices[0]?.message?.content || "";
    return {
      response: {
        text: () => text,
      },
    };
  },
};
