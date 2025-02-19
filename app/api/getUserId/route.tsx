import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      userId = uuidv4(); // ✅ Generate a valid UUID
      cookieStore.set("user_id", userId, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }

    console.log("✅ User ID:", userId); // Debugging
    return NextResponse.json({ userId });
  } catch (error) {
    console.error("❌ Error in getUserId route:", error);
    return NextResponse.json({ error: "Failed to fetch user ID" }, { status: 500 });
  }
}
