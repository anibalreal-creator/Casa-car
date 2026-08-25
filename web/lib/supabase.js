import { createClient } from "@supabase/supabase-js";
import { assertSupabaseBrowserEnv } from "./runtimeConfig";

let client = null;

function getSupabaseClient() {
  if (client) return client;
  const { url, anonKey } = assertSupabaseBrowserEnv();
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return client;
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSupabaseClient()[prop];
    },
  }
);
