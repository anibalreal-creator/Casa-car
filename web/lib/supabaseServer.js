
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseServerEnv, getSupabasePublicEnv } from "./runtimeConfig";

const SERVER_AUTH_OPTIONS = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

export function getSupabaseServer() {
  const { url, serviceRoleKey } = assertSupabaseServerEnv();

  return createClient(
    url,
    serviceRoleKey,
    SERVER_AUTH_OPTIONS
  );
}

export function getSupabaseUserClient(accessToken) {
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey || !accessToken) {
    throw new Error("Falta sesion de usuario para operar con seguridad");
  }

  return createClient(url, anonKey, {
    ...SERVER_AUTH_OPTIONS,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
