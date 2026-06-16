
import { requireAuthenticatedRoute } from "../../../../lib/apiRouteGuards";
import { buildPremiumPreference, mercadoPagoRequest } from "../../../../lib/mercadopago";
import { getSupabaseServer } from "../../../../lib/supabaseServer";
import { enforcePremiumActivationLimit } from "../../../../lib/listingLimits";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ error: "Falta listingId" });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN"
      });
    }

    const supabase = getSupabaseServer();
    const { data: listing, error } = await supabase.from("listings").select("*").eq("id", String(listingId)).maybeSingle();
    if (error) throw error;
    if (!listing) return res.status(404).json({ error: "Anuncio no encontrado" });
    if (!listing.user_id || String(listing.user_id) !== String(user.id)) {
      return res.status(403).json({ error: "No podés pagar premium para un anuncio de otro usuario" });
    }

    const premiumQuota = await enforcePremiumActivationLimit(supabase, user, { excludeListingId: listingId });
    if (!premiumQuota.canActivatePremium) {
      return res.status(402).json(premiumQuota.blockedResponse);
    }

    const preference = buildPremiumPreference({ listing, user });
    const data = await mercadoPagoRequest("/checkout/preferences", { method: "POST", body: preference });

    return res.status(200).json({
      checkout_url: data.init_point,
      chosen_checkout_url: data.init_point,
      sandbox_checkout_url: data.sandbox_init_point || null,
      preference_id: data.id || null,
    });

  } catch (error) {
    console.error("create premium preference error:", error);
    res.status(500).json({ error: "Error creando preferencia" });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
