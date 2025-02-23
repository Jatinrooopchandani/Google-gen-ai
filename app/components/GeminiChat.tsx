"use client";

import { useState, useEffect } from "react";
import { fetchGeminiResponse } from "../utils/gemini";
import { supabase } from "../utils/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export default function GeminiChat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
      let currentUserId = userData?.user?.id;
        if(!currentUserId){
          const {data: authData, error: authError} = await supabase.auth.signInAnonymously();
          if(authError) throw new Error(authError.message);
          currentUserId = authData?.user?.id;
        }
        if (currentUserId) {
          console.log("✅ Logged in as:", currentUserId);
          setUserId(currentUserId);
        }
      } catch (err) {
        console.error("❌ Auth Error:", err);
        setError("Failed to authenticate user");
      }
    };
    authenticateUser();
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
