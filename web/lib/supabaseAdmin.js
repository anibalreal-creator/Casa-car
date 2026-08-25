import { getSupabaseServer } from './supabaseServer';

export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSupabaseServer()[prop];
    },
  }
);
