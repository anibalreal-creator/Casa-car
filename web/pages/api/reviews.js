import { getSupabaseServer } from "../../lib/supabaseServer";
import { checkRateLimit } from "../../lib/server/rateLimit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeText(value = "", maxLength = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

async function getListingOwner(supabase, listingId) {
  const { data, error } = await supabase
    .from("listings")
    .select("id,user_id,status")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data || data.status !== "active") return null;
  return data;
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  if (req.method === "GET") {
    if (!checkRateLimit(req, res, { name: "reviews-read", limit: 120, windowMs: 60_000 })) return;
    const { listing_id, target_user_id } = req.query;
    try {
      let resolvedTargetUserId = String(target_user_id || "").trim();
      if (resolvedTargetUserId && !UUID_RE.test(resolvedTargetUserId)) {
        return res.status(400).json({ error: "target_user_id invalido" });
      }

      if (!resolvedTargetUserId && listing_id) {
        const listingId = String(listing_id || "").trim();
        if (!UUID_RE.test(listingId)) return res.status(400).json({ error: "listing_id invalido" });
        const listing = await getListingOwner(supabase, listingId);
        resolvedTargetUserId = listing?.user_id || "";
      }
      if (!resolvedTargetUserId) return res.status(400).json({ error: "Falta listing_id o target_user_id" });

      const { data, error } = await supabase
        .from("reviews")
        .select("id,rating,comment,reviewer_name,created_at,target_user_id")
        .eq("target_user_id", resolvedTargetUserId)
        .order("created_at", { ascending: false });
      if (error) return res.status(500).json({ error: "No se pudieron cargar las resenas" });

      const reviews = data || [];
      const count = reviews.length;
      const avg = count ? Number((reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / count).toFixed(1)) : 0;
      return res.status(200).json({ summary: { rating_avg: avg, reviews_count: count }, reviews });
    } catch {
      return res.status(500).json({ error: "No se pudieron cargar las resenas" });
    }
  }

  if (req.method === "POST") {
    if (!checkRateLimit(req, res, { name: "reviews-write", limit: 10, windowMs: 10 * 60_000 })) return;

    try {
      const body = req.body || {};
      const listingId = sanitizeText(body.listing_id, 120);
      if (!listingId || !UUID_RE.test(listingId)) return res.status(400).json({ error: "listing_id invalido" });

      const rating = Number(body.rating || 0);
      if (rating < 1 || rating > 5) return res.status(400).json({ error: "La calificacion debe ser entre 1 y 5" });
      const comment = sanitizeText(body.comment || "", 1000);
      if (!comment) return res.status(400).json({ error: "La resena no puede estar vacia" });

      const listing = await getListingOwner(supabase, listingId);
      if (!listing) return res.status(404).json({ error: "Publicacion no encontrada" });

      const payload = {
        target_user_id: listing.user_id,
        author_user_id: null,
        rating,
        comment,
        reviewer_name: sanitizeText(body.reviewer_name || "Usuario Casa-Car", 80),
        reviewer_email: sanitizeText(body.reviewer_email || "", 160),
      };
      const { data, error } = await supabase
        .from("reviews")
        .insert(payload)
        .select("id,rating,comment,reviewer_name,created_at,target_user_id")
        .single();
      if (error) return res.status(500).json({ error: "No se pudo guardar la resena" });
      return res.status(200).json(data);
    } catch {
      return res.status(500).json({ error: "No se pudo guardar la resena" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
    responseLimit: "1mb",
  },
};
