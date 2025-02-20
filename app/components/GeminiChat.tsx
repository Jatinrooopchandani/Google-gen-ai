"use client";

import { useState, useEffect } from "react";
import { fetchGeminiResponse } from "../utils/gemini";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  // ✅ Fetch User ID from API on mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("/api/getUserId");
        const data = await res.json();
        if (data.userId) {
          console.log("✅ Retrieved User ID:", data.userId);
          setUserId(data.userId);
        } else {
          console.error("❌ Failed to retrieve user ID");
        }
      } catch (err) {
        console.error("❌ Error fetching user ID:", err);
      }
    };

    fetchUserId();
  }, []);

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/getHistory?userId=${userId}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        console.log("✅ Loaded history:", data);
        setHistory(data);
      } catch (err) {
        console.error("❌ Fetch History Error:", err);
        setError("Failed to fetch history");
      }
    };


  const handleSubmit = async () => {
    if (!input.trim() || !userId) return;

    setLoading(true);
    setResponse("");
    setError("");

    try {
      const result = await fetchGeminiResponse(input);
      const outputText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from API";

      setResponse(outputText);

      // ✅ Save to Supabase
      const { error } = await supabase
        .from("prompts")
        .insert([{ user_id: userId, prompt: input, response: outputText }]);

      if (error) {
        console.error("❌ Supabase Insert Error:", error.message);
        setError(`Failed to save to database: ${error.message}`);
        return;
      }

      // ✅ Update history
      setHistory([{ prompt: input, response: outputText }, ...history]);
    } catch (err) {
      console.error("❌ API Error:", err);
      setError("Failed to fetch response");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4 bg-white shadow-lg rounded-xl">
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask Gemini..."
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-blue-300"
      />
      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? "Loading..." : "Send"}
      </Button>
      <Button onClick={fetchHistory} className="w-full hover:placeholder-blue-300">
        View History
      </Button>
      {error && <p className="text-red-500">{error}</p>}
      {response && <p className="text-gray-700"><strong>Response:</strong> {response}</p>}
      
      <h3 className="text-lg font-semibold">Prompt History</h3>
      <ul className="space-y-2">
        {history.map((item, index) => (
          <li key={index} className="p-3 bg-gray-100 rounded-lg shadow-sm">
            <strong>Q:</strong> {item.prompt} <br />
            <strong>A:</strong> {item.response}
          </li>
        ))}
      </ul>
    </div>
  );
}
