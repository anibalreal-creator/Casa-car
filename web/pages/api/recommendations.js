import { getSupabaseServer } from "../../lib/supabaseServer";

function score(item) {
  let s = 0;
  s += Number(item.views || 0) * 0.4;
  s += item.is_premium ? 20 : 0;
  s += item.featured ? 15 : 0;
  s += item.images?.length ? Math.min(item.images.length, 10) * 2 : 0;
  s += item.price ? 5 : 0;
  return s;
}

export default async function handler(_req, res) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });

  const items = (data || []).map((item) => {
    let images = item.images;
    if (typeof images === "string") {
      try { images = JSON.parse(images); } catch { images = []; }
    }
    images = Array.isArray(images) ? images : [];
    return { ...item, images, ai_score: score({ ...item, images }) };
  }).sort((a, b) => b.ai_score - a.ai_score).slice(0, 12);

  return res.status(200).json(items);
}
