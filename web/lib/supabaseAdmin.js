import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://cdmlyrjccdxakvbmbbpp.supabase.co",
  "sb_publishable_j6ibbVlh7A_S4ww4P3wUEg_YxgzDO1u"
)

export { supabase }