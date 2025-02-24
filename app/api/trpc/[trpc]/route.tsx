import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../utils/trpc";
import { createContext } from "../../../utils/trpcContext";
import { NextRequest } from "next/server";

export default async function handler(req: NextRequest) {
  console.log(" Handling API Request at /api/trpc");

  const context = await createContext(req); // Ensure session is passed

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => context, // Pass session info
  });
}

export { handler as GET, handler as POST };
