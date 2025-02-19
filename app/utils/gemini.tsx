export const fetchGeminiResponse = async (prompt: string) => {
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch API response");
      }
  
      return response.json();
    } catch (error) {
      console.error("❌ Fetch Error:", error);
      throw error;
    }
  };
  