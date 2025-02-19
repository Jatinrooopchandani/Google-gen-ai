import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import  getUserId  from "@/app/utils/cookies"; // ✅ Ensure correct import

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // ✅ Make sure you're using the Service Role Key
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { prompt, response } = await req.json();
    if (!prompt || !response) {
      return NextResponse.json({ error: "Missing prompt or response" }, { status: 400 });
    }

    const userId = await getUserId(); // ✅ Ensure this function works

    const { data, error } = await supabase
      .from("prompts")
      .insert([{ user_id: userId, prompt, response }])
      .select();

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (err) {
    console.error("❌ Server Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
