import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local")
}

if (!supabaseKey) {
  throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local")
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)