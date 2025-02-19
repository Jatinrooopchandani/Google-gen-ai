"use client";

import { useState, useEffect } from "react";
import { fetchGeminiResponse } from "../utils/gemini";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function GeminiChat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Fetch User ID from API
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("/api/getUserId");
        const data = await res.json();
        setUserId(data.userId);
      } catch (err) {
        console.error("❌ Error fetching user ID:", err);
      }
    };

    fetchUserId();
  }, []);

  // ✅ Fetch prompt history when userId is set
  useEffect(() => {
    if (!userId) return;
    
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("prompts")
          .select("prompt, response")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error("❌ Fetch History Error:", err);
        setError("Failed to fetch history");
      }
    };

    fetchHistory();
  }, [userId]);

  const handleSubmit = async () => {
    if (!input.trim() || !userId) return;
  
    setLoading(true);
    setResponse("");
    setError("");
  
    try {
      const result = await fetchGeminiResponse(input);
      const outputText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from API";
  
      setResponse(outputText);
  
      // ✅ Save to Supabase with Error Handling
      const { error } = await supabase.from("prompts").insert([
        { user_id: userId, prompt: input, response: outputText }
      ]);
  
      if (error) {
        console.error("❌ Supabase Insert Error:", error);
        setError("Failed to save to database");
        return;
      }
  
      // ✅ Update history immediately
      setHistory([{ prompt: input, response: outputText }, ...history]);
    } catch (err) {
      console.error("❌ API Error:", err);
      setError("Failed to fetch response");
    }
  
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask Gemini..."
        style={{ padding: "8px", marginRight: "10px" }}
      />
      <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px" }}>
        {loading ? "Loading..." : "Send"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {response && <p><strong>Response:</strong> {response}</p>}

      <h3>Prompt History</h3>
      <ul>
        {history.map((item, index) => (
          <li key={index}>
            <strong>Q:</strong> {item.prompt} <br />
            <strong>A:</strong> {item.response}
          </li>
        ))}
      </ul>
    </div>
  );
}
