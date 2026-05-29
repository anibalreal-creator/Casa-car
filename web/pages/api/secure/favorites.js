import { getSupabaseServer } from "../../../lib/supabaseServer";
import { getServerUser } from "../../../lib/auth";

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

async function listFavoriteRows(supabase, userId) {
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

function toOrderedIds(rows = []) {
  return rows
    .map((row) => String(row.listing_id || "").trim())
    .filter((value) => isUuid(value));
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();
  const user = await getServerUser(req);

  if (!user) {
    return res.status(401).json({ error: "No autorizado", ids: [], items: [] });
  }

  try {
    if (req.method === "GET") {
      const rows = await listFavoriteRows(supabase, user.id);
      const ids = toOrderedIds(rows);

      if (req.query?.mode === "ids") {
        return res.status(200).json({ ids });
      }

      if (!ids.length) {
        return res.status(200).json({ ids: [], items: [] });
      }

      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .in("id", ids);

      if (listingsError) {
        console.error("Error cargando listings de favoritos:", listingsError);
        return res.status(200).json({
          ids,
          items: [],
          details_error: listingsError.message || "No se pudieron cargar los detalles",
        });
      }

      const map = new Map((listings || []).map((item) => [String(item.id), item]));
      const ordered = ids.map((id) => map.get(String(id))).filter(Boolean);

      return res.status(200).json({
        ids,
        items: ordered,
        missing_ids: ids.filter((id) => !map.has(String(id))),
      });
    }

    if (req.method === "POST") {
      const listingId = String(req.body?.listing_id || "").trim();

      if (!listingId) {
        return res.status(400).json({ error: "listing_id es requerido" });
      }

      if (!isUuid(listingId)) {
        return res.status(400).json({ error: "Solo se aceptan UUID reales de listings" });
      }

      const { data: listingExists, error: listingError } = await supabase
        .from("listings")
        .select("id")
        .eq("id", listingId)
        .maybeSingle();

      if (listingError) throw listingError;

      if (!listingExists?.id) {
        return res.status(404).json({ error: "El listing favorito no existe en Supabase" });
      }

      const { data: existing, error: existingError } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        const { error: deleteError } = await supabase
          .from("favorites")
          .delete()
          .eq("id", existing.id);

        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            listing_id: listingId,
          });

        if (insertError) throw insertError;
      }

      const rows = await listFavoriteRows(supabase, user.id);
      const ids = toOrderedIds(rows);

      return res.status(200).json({ ok: true, ids });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error("Error en favorites API:", error);
    return res.status(500).json({ error: error?.message || "Error interno", ids: [], items: [] });
  }
}
