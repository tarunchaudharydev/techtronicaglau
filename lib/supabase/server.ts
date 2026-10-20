import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/types/database";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./config";

export async function createClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  const cookieStore = await cookies();
  const clerkAuth = await auth();

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot write cookies; Clerk middleware owns the identity session.
        }
      },
    },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    accessToken: async () => await clerkAuth.getToken(),
  });
}

