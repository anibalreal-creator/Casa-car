import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://cdmlyrjccdxakvbmbbpp.supabase.co"
const supabaseKey = "sb_publishable_j6ibbVlh7A_S4ww4P3wUEg_YxgzDO1u"

export const supabase = createClient(supabaseUrl, supabaseKey)