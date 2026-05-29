import { getSupabaseServer } from "../../lib/supabaseServer";

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  if (req.method === "GET") {
    const { user_id } = req.query;
    const { data, error } = await supabase.from("seller_profiles").select("*").eq("user_id", user_id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || null);
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const payload = {
      user_id: body.user_id,
      display_name: body.display_name || "",
      bio: body.bio || "",
      phone: body.phone || "",
      city: body.city || "",
      country: body.country || ""
    };

    const existing = await supabase.from("seller_profiles").select("id").eq("user_id", body.user_id).maybeSingle();

    if (existing.data?.id) {
      const { data, error } = await supabase.from("seller_profiles").update(payload).eq("user_id", body.user_id).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    const { data, error } = await supabase.from("seller_profiles").insert(payload).select("*").single();
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
