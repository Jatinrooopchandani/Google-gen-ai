import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export default async function getUserId() {
  const cookieStore = await cookies(); // ✅ Get the cookies store
  let userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    userId = uuidv4();
    cookieStore.set("user_id", userId, { maxAge: 60 * 60 * 24 * 365 }); // 1-year expiration
  }

  return userId;
}
