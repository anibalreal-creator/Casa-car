import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { getServerUser } from "../../lib/auth";
import { isAdmin } from "../../lib/permissions";
import { checkRateLimit } from "../../lib/server/rateLimit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (!checkRateLimit(req, res, { name: "favorites-read", limit: 120, windowMs: 60_000 })) return;
      const { listing_id, user_id } = req.query;

      if (listing_id) {
        const listingId = String(listing_id || "").trim();
        if (!UUID_RE.test(listingId)) return res.status(400).json({ error: "listing_id invalido" });
        const { count, error } = await supabaseAdmin
          .from("favoritos")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", listingId);
        if (error) throw error;
        return res.json({ count: Number(count || 0) });
      }

      if (user_id) {
        const userId = String(user_id || "").trim();
        if (!UUID_RE.test(userId)) return res.status(400).json({ error: "user_id invalido" });
        const user = await getServerUser(req);
        if (!user) return res.status(401).json({ error: "No autorizado" });
        if (String(user.id) !== userId && !(await isAdmin(user.id, user.email))) {
          return res.status(403).json({ error: "No autorizado" });
        }

        const { data, error } = await supabaseAdmin
          .from("favoritos")
          .select("id,listing_id,created_at")
          .eq("user_id", userId);
        if (error) throw error;
        return res.json(data || []);
      }

      return res.status(400).json({ error: "Falta parametro" });
    }

    if (req.method === "POST") {
      if (!checkRateLimit(req, res, { name: "favorites-write", limit: 60, windowMs: 60_000 })) return;
      const user = await getServerUser(req);
      if (!user) return res.status(401).json({ error: "No autorizado" });
      const listingId = String(req.body?.listing_id || "").trim();
      if (!UUID_RE.test(listingId)) return res.status(400).json({ error: "listing_id invalido" });
      const userId = user.id;

      const { data: existing, error: existingError } = await supabaseAdmin
        .from("favoritos")
        .select("id")
        .eq("user_id", userId)
        .eq("listing_id", listingId)
        .limit(1);
      if (existingError) throw existingError;

      if ((existing || []).length > 0) {
        await supabaseAdmin
          .from("favoritos")
          .delete()
          .eq("user_id", userId)
          .eq("listing_id", listingId);
        return res.json({ action: "removed" });
      }

      await supabaseAdmin.from("favoritos").insert({ user_id: userId, listing_id: listingId });
      return res.json({ action: "added" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch {
    return res.status(500).json({ error: "No se pudo procesar favoritos" });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
    responseLimit: "1mb",
  },
};
