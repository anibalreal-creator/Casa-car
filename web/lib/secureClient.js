import { supabaseBrowser } from "./supabaseBrowser";

export async function authHeaders(extra = {}) {
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data?.session?.access_token;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function secureFetch(url, options = {}) {
  const headers = await authHeaders(options.headers || {});
  return fetch(url, { ...options, headers });
}
