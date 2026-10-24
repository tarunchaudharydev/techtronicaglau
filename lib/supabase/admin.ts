import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseUrl } from "./config";

/** Server-only client for authenticated scheduled maintenance. Never import in a Client Component. */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secret) return null;

  return createSupabaseClient<Database>(supabaseUrl, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "x-application-name": "techtronica-internship-cron" },
    },
  });
}
