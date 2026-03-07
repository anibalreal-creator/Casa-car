import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL no está definido")
}

if (!supabaseKey) {
  throw new Error("SUPABASE_KEY no está definido")
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)