"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../utils/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "../../utils/trpcClient";

export default function GeminiChat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const geminiMutation = trpc.getGeminiResponse.useMutation({
    onSuccess: async (data) => {
      if (data?.response) {
        setResponse(data.response);
        await insertPrompt(input, data.response); 
      } else {
        console.error(" ERROR: No response from Gemini");
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const authenticateUser = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      let currentUserId = userData?.user?.id;

      if (!currentUserId) {
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw new Error(authError.message);
        currentUserId = authData?.user?.id;
      }

      if (currentUserId) {
        console.log("Logged in as:", currentUserId);
        setUserId(currentUserId);
        setIsAuthenticated(true);
        getHistory(currentUserId); 
      }
    } catch (err) {
      console.error(" Auth Error:", err);
      setError("Failed to authenticate user");
    }
  }, []);

  const getHistory = useCallback(
    async (uid: string | null = userId) => {
      if (!uid) return;

      try {
        const { data, error } = await supabase
          .from("prompts")
          .select("prompt, response")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(" Supabase Error:", error.message);
          setError("Failed to load history");
          return;
        }

        console.log(" Loaded history:", data);
        setHistory(data.map((item) => ({ prompt: item.prompt || "", response: item.response || "" })));
      } catch (err) {
        console.error(" Server Error:", err);
        setError("Failed to fetch history");
      }
    },
    [userId]
  );

  useEffect(() => {
    authenticateUser();
  }, [authenticateUser]);

  const insertPrompt = async (prompt: string, response: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("prompts")
        .insert([{ user_id: userId, prompt, response }]);

      if (error) {
        console.error(" Supabase Insert Error:", error.message);
        return;
      }

      console.log(" Prompt saved to history");
      getHistory(); 
    } catch (err) {
      console.error(" Insert Error:", err);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    if (!isAuthenticated || !userId) {
      console.error(" Cannot send request: User not authenticated");
      setError("You must be logged in to send requests.");
      return;
    }

    setLoading(true);
    setResponse("");
    setError("");

    geminiMutation.mutate({ userId, prompt: input });
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
      <Button onClick={handleSubmit} disabled={loading || !isAuthenticated} className="w-full">
        {loading ? "Loading..." : "Send"}
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
