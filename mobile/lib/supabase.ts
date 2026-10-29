import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
}

// Clerk owns the session. The active Clerk JWT is passed per request for existing RLS policies.
let clerkToken: () => Promise<string | null> = async () => null;

export function setClerkTokenProvider(provider: () => Promise<string | null>) {
  clerkToken = provider;
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  accessToken: async () => clerkToken(),
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
});
