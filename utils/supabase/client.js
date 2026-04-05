import { createBrowserClient } from "@supabase/ssr";

// Singleton — prevents multiple instances competing for the auth token lock
let client;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return client;
}
