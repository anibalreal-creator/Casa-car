import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Esto ayuda a detectar el problema rápido cuando falta el .env.local
  // eslint-disable-next-line no-console
  console.error(
    "FALTAN ENV: NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY en web/.env.local"
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
