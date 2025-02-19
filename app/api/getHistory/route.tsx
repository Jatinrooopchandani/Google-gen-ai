import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log("🔍 Fetching history for user:", userId);

    const { data, error } = await supabase
      .from("prompts")
      .select("prompt, response")
      .filter("user_id", "eq", userId) // ✅ Fix: Ensuring correct filtering
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("✅ Loaded History:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
