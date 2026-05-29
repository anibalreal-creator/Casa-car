import { getSupabaseServer } from "../../lib/supabaseServer";

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  if (req.method === "POST") {
    const body = req.body || {};
    const payload = {
      title: body.title || "",
      search_query: body.search_query || "",
      category: body.category || "",
      country: body.country || "",
      city: body.city || "",
      min_price: body.min_price ? Number(body.min_price) : null,
      max_price: body.max_price ? Number(body.max_price) : null
    };
    const { data, error } = await supabase.from("saved_alerts").insert(payload).select("*").single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
