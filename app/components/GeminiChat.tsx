"use client";

import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "../utils/trpcClient";

export default function GeminiChat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { data, refetch } = trpc.getHistory.useQuery(
    { userId:  userId?? "" },
    { enabled: false }
  );
  
  useEffect(() => {
    if (data) {
      console.log("Loaded history:", data);
      setHistory(data.map((item)=>({
        prompt: item.prompt || "",
        response: item.response || "",
      })
    ));
    }
  }, [data]);
  const geminiMutation = trpc.getGeminiResponse.useMutation({
    onSuccess: (data) => {
      if (data) {
        setResponse(data.response);
      }
      else{
        console.log("ERRORRRR");
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });
  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const { data: userData} = await supabase.auth.getUser();
      let currentUserId = userData?.user?.id;
        if(!currentUserId){
          const {data: authData, error: authError} = await supabase.auth.signInAnonymously();
          if(authError) throw new Error(authError.message);
          currentUserId = authData?.user?.id;
        }
        if (currentUserId) {
          console.log("Logged in as:", currentUserId);
          setUserId(currentUserId);
        }
      } catch (err) {
        console.error(" Auth Error:", err);
        setError("Failed to authenticate user");
      }
    };
    authenticateUser();
  }, []);

    


  const handleSubmit = async () => {
    if (!input.trim() || !userId) return;

    setLoading(true);
    setResponse("");
    setError("");

    geminiMutation.mutate({ userId: userId, prompt: input });
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
      <Button onClick={() => refetch()} className="w-full">
  Refresh History
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
