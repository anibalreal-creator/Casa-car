import { supabase } from "../../lib/supabaseAdmin"
export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseAdmin
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