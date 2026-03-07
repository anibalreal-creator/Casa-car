import { supabaseAdmin } from "../../lib/supabaseAdmin";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const mapped = (data || []).map((r) => ({
      id: r.id,
      title: r.title ?? r.titulo ?? null,
      price: r.price ?? r.precio ?? null,
      currency: r.currency ?? r.moneda ?? null,
      description: r.description ?? r.descripcion ?? null,
      created_at: r.created_at ?? null,
      user_id: r.user_id ?? null,
      photos: r.photos ?? null,
    }));

    return res.status(200).json(mapped);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
