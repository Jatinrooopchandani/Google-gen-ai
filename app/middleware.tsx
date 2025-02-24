import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  console.log("🟢 Middleware executing for:", req.nextUrl.pathname);

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Ensure session exists
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("❌ Middleware Supabase Error:", error.message);
  }
  if (!session) {
    console.warn("⚠️ No session found in middleware");
  } else {
    console.log("✅ Middleware User Session:", session);
  }

  return res;
}

// Apply middleware to all API routes and auth-protected pages
export const config = {
  matcher: ["/api/:path*", "/protected/:path*"],
};
