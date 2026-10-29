import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let clerkToken: () => Promise<string | null> = async () => null;
let client: SupabaseClient<Database> | undefined;

// Keep construction lazy so the root layout can show a useful setup screen when env vars are missing.
function getClient(): SupabaseClient<Database> {
  if (client) return client;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }
  client = createClient<Database>(supabaseUrl, supabaseKey, {
    accessToken: async () => clerkToken(),
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  return client;
}

export function setClerkTokenProvider(provider: () => Promise<string | null>) {
  clerkToken = provider;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, property) {
    const value = Reflect.get(getClient(), property, getClient());
    return typeof value === 'function' ? value.bind(getClient()) : value;
  },
});
