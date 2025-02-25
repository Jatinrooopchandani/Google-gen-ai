import { initTRPC } from '@trpc/server';
import { z } from "zod";

const t = initTRPC.create();

export const appRouter = t.router({
    getGeminiResponse: t.procedure
      .input(
        z.object({
          userId: z.string(),
          prompt: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          console.log("📩 Received request:", input);
          const apiKey = process.env.GOOGLE_API_KEY;
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
          
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: input.prompt }] }],
            }),
          });

          console.log("📩 Response Status:", response.status); 

          if (!response.ok) {
            const errorMessage = await response.text();
            console.error(`Gemini API Error: ${response.status} - ${errorMessage}`);
            return { response: "Error fetching response" };
          }

          const result = await response.json();
          const outputText: string = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

          console.log("Gemini Response:", outputText);
          return { response: outputText };

        } catch (error) {
          console.error("Server Error:", error);
          return { response: "Server error" };
        }
      }),
});

export type AppRouter = typeof appRouter;
