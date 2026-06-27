import { getSupabaseServer } from "../../lib/supabaseServer";
import { requireAuthenticatedRoute } from "../../lib/apiRouteGuards";
import { checkRateLimit } from "../../lib/server/rateLimit";

function clean(value = "", max = 180) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!checkRateLimit(req, res, { name: "alerts-write", limit: 20, windowMs: 10 * 60_000 })) return;

  const user = await requireAuthenticatedRoute(req, res);
  if (!user) return;

  const supabase = getSupabaseServer();
  const body = req.body || {};
  const payload = {
    title: clean(body.title || "Busqueda guardada", 120),
    search_query: clean(body.search_query, 240),
    category: clean(body.category, 80),
    country: clean(body.country, 80),
    city: clean(body.city, 120),
    min_price: body.min_price ? Number(body.min_price) : null,
    max_price: body.max_price ? Number(body.max_price) : null,
  };

  const { data, error } = await supabase.from("saved_alerts").insert(payload).select("id,title,search_query,category,country,city,min_price,max_price").single();
  if (error) return res.status(500).json({ error: "No se pudo guardar la alerta" });
  return res.status(200).json(data);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '1mb',
  },
};
