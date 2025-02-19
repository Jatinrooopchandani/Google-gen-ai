"use client"; // 👈 Required for client-side features

import { useState } from "react";
import { fetchGeminiResponse } from "../utils/gemini";

export default function GeminiChat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResponse("");
    setError("");

    try {
      const result = await fetchGeminiResponse(input);

      // ✅ Correctly extract text response
      const outputText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from API";
      setResponse(outputText);
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
      
      {error && <p style={{ color: "red" }}>⚠️ {error}</p>}
      {response && <p><strong>Response:</strong> {response}</p>}
    </div>
  );
}
