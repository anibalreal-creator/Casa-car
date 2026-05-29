import { getSupabaseServer } from "../../lib/supabaseServer";
import { checkRateLimit } from "../../lib/server/rateLimit";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!checkRateLimit(req, res, { name: "listing-view", limit: 120, windowMs: 60_000 })) return;

  const supabase = getSupabaseServer();
  const body = req.body || {};
  const id = String(body.id || "").trim();
  if (!id) return res.status(400).json({ error: "Falta id" });

  const { data: current, error: currentError } = await supabase.from("listings").select("views").eq("id", id).single();
  if (currentError) return res.status(500).json({ error: currentError.message });

  const nextViews = Number(current?.views || 0) + 1;
  const { error } = await supabase.from("listings").update({ views: nextViews }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("listing_events").insert({ listing_id: id, event_type: "view", source: "listing-page" });
  return res.status(200).json({ ok: true, views: nextViews });
}
