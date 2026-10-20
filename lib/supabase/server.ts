import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/types/database";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./config";

export async function createClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  const clerkAuth = await auth();

  return createSupabaseClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    accessToken: async () => await clerkAuth.getToken(),
  });
}
