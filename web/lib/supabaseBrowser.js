import { createClient } from "@supabase/supabase-js";
import { assertSupabaseBrowserEnv } from "./runtimeConfig";

let browserClient = null;

function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const { url, anonKey } = assertSupabaseBrowserEnv();
  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return browserClient;
}

export const supabaseBrowser = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSupabaseBrowserClient()[prop];
    },
  }
);
