import { getSupabaseServer } from "../../lib/supabaseServer";
import { getServerUser } from "../../lib/auth";
import { checkRateLimit } from "../../lib/server/rateLimit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value = "", max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  if (req.method === "GET") {
    if (!checkRateLimit(req, res, { name: "seller-profile-read", limit: 120, windowMs: 60_000 })) return;
    const { user_id } = req.query;
    const userId = String(user_id || "").trim();
    if (!userId || !UUID_RE.test(userId)) return res.status(400).json({ error: "user_id invalido" });
    const { data, error } = await supabase
      .from("seller_profiles")
      .select("user_id,display_name,bio,phone,city,country,is_verified,created_at,updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return res.status(500).json({ error: "No se pudo cargar el perfil" });
    return res.status(200).json(data || null);
  }

  if (req.method === "POST") {
    if (!checkRateLimit(req, res, { name: "seller-profile-write", limit: 20, windowMs: 60_000 })) return;
    const user = await getServerUser(req);
    if (!user) return res.status(401).json({ error: "No autorizado" });
    const body = req.body || {};
    const payload = {
      user_id: user.id,
      display_name: clean(body.display_name, 120),
      bio: clean(body.bio, 1000),
      phone: clean(body.phone, 80),
      city: clean(body.city, 120),
      country: clean(body.country, 120)
    };

    const existing = await supabase.from("seller_profiles").select("id").eq("user_id", user.id).maybeSingle();

    if (existing.data?.id) {
      const { data, error } = await supabase
        .from("seller_profiles")
        .update(payload)
        .eq("user_id", user.id)
        .select("user_id,display_name,bio,phone,city,country,is_verified,created_at,updated_at")
        .single();
      if (error) return res.status(500).json({ error: "No se pudo guardar el perfil" });
      return res.status(200).json(data);
    }

    const { data, error } = await supabase
      .from("seller_profiles")
      .insert(payload)
      .select("user_id,display_name,bio,phone,city,country,is_verified,created_at,updated_at")
      .single();
    if (error) return res.status(500).json({ error: "No se pudo guardar el perfil" });
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
