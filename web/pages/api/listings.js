import { createClient } from "@supabase/supabase-js"

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      "https://cdmlyrjccdxakvbmbbpp.supabase.co",
      "sb_publishable_j6ibbVlh7A_S4ww4P3wUEg_YxgzDO1u"
    )

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(data || [])
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Error interno en /api/listings"
    })
  }
}