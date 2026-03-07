import { createClient } from "@supabase/supabase-js";

// ⚠️ SOLO server-side: service role key NO debe ir en NEXT_PUBLIC
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(url, service);
