import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function createContext(req: NextRequest) {
  let res = NextResponse.next();

  console.log("🟢 Processing request in createContext...");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => {
          const value = req.cookies.get(key)?.value;
          return value;
        },
      },
    }
  );

  // Fetch session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) console.error("❌ Supabase Auth Error:", error.message);

  return { supabase, user: session?.user ?? null, req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
