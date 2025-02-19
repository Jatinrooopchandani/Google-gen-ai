import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies(); 
  let userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    userId = uuidv4();

    const response = NextResponse.json({ userId });
    response.headers.set(
      "Set-Cookie",
      `user_id=${userId}; Path=/; Max-Age=${60 * 60 * 24 * 365}; HttpOnly; ${
        process.env.NODE_ENV === "production" ? "Secure" : ""
      }`
    );
    return response;
  }

  return NextResponse.json({ userId });
}
