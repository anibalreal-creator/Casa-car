import { getSupabaseServer } from "../../lib/supabaseServer";
import { checkRateLimit } from "../../lib/server/rateLimit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!checkRateLimit(req, res, { name: "listing-view", limit: 120, windowMs: 60_000 })) return;

  try {
    const supabase = getSupabaseServer();
    const body = req.body || {};
    const id = String(body.id || "").trim();
    if (!id || !UUID_RE.test(id)) return res.status(400).json({ error: "id invalido" });

    const { data: current, error: currentError } = await supabase
      .from("listings")
      .select("views,status")
      .eq("id", id)
      .maybeSingle();
    if (currentError || !current || current.status !== "active") return res.status(200).json({ ok: true, ignored: true });

    const nextViews = Number(current.views || 0) + 1;
    const { error } = await supabase.from("listings").update({ views: nextViews }).eq("id", id);
    if (error) return res.status(200).json({ ok: true });

    await supabase.from("listing_events").insert({ listing_id: id, event_type: "view", source: "listing-page" });
    return res.status(200).json({ ok: true, views: nextViews });
  } catch {
    return res.status(200).json({ ok: true });
  }
}
