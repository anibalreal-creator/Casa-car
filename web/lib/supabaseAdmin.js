import { createClient } from "@supabase/supabase-js"

throw new Error("PRUEBA_SUPABASEADMIN")

const supabaseUrl = "https://cdmlyrjccdxakvbmbbpp.supabase.co"
const supabaseKey = "sb_publishable_j6ibbVlh7A_S4ww4P3wUEg_YxgzDO1u"

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)