import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";
import getUserId from "@/app/utils/cookies";

export async function GET() {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
