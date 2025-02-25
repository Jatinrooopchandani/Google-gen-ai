import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "./trpc";
import { supabase } from "./supabase";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      async headers() {
        const { data: session } = await supabase.auth.getSession();
        return {
          Authorization: session?.session?.access_token ? `Bearer ${session.session.access_token}` : "",
        };
      },
    }),
  ],
});
