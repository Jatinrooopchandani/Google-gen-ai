import { initTRPC } from '@trpc/server';
import { z } from "zod";
import { supabase } from "./supabase";

const t = initTRPC.create();

export const appRouter = t.router({
    getGeminiResponse: t.procedure
      .input(
        z.object({
            userId: z.string(),
          prompt: z.string(),
        })
      )
      .mutation(async({input}) => {
            try {
                console.log(" Received request with:", input);
                const apiKey = process.env.GOOGLE_API_KEY;
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                const response = await fetch(apiUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: input.prompt }] }], // ✅ Correct request format
                  }),
                });
                
console.log("📩 Response Status:", response.status); 
                if (!response.ok) {
                  const errorMessage = await response.text();
                  console.error(`Gemini API Error: ${response.status} - ${errorMessage}`);
                }
                const result = await response.json();
                const outputText:string = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
                console.log("🔹 Inserting into Supabase. User ID:", input.userId);
                const { error } = await supabase
                .from("prompts")
                .insert([{ user_id: input.userId, prompt: input.prompt, response: outputText }]);
                if (error) {
                    console.error(" Supabase Insert Error:", error.message);
                  }
                return { response: outputText };
                
              } catch (error) {
                console.error("Server Error:", error);
              }
      }),
    getHistory: t.procedure
      .input(z.object({ userId: z.string() })).query(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("prompts")
            .select("prompt, response")
            .eq("user_id", input.userId)
            .order("created_at", { ascending: false });
          if (error) {
            console.error(" Supabase Error:", error.message);
            return [];
          }
          return data;
        } catch (error) {
          console.error(" Server Error:", error);
          return [];
        }
      }),
  });

  export type AppRouter = typeof appRouter;