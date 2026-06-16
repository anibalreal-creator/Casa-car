import { requireAuthenticatedRoute } from "../../../../lib/apiRouteGuards";
import { buildSubscriptionPreference, mercadoPagoRequest } from "../../../../lib/mercadopago";
import { AD_PLAN_CONFIG } from "../../../../lib/adPlans";

function planInfo(key) {
  const config = AD_PLAN_CONFIG[key];
  if (!config) return null;
  return {
    price: Number(config.revenue || 0),
    publications: Number(config.maxListings || 0),
    premiumSlots: Number(config.maxPremiumListings || 0),
    maxCampaigns: Number(config.maxCampaigns || 0),
    maxActiveCampaigns: Number(config.maxActiveCampaigns || 0),
    analytics: Boolean(config.analytics),
    companyPanel: Boolean(config.companyPanel),
  };
}

const PLAN_CATALOG = {
  PRO: planInfo('PRO'),
  BUSINESS: planInfo('BUSINESS'),
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const plan = String(req.body?.plan || "").trim().toUpperCase();
    const planInfo = PLAN_CATALOG[plan];
    if (!planInfo) return res.status(400).json({ error: "Plan invalido" });

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN && !process.env.MP_ACCESS_TOKEN) {
      return res.status(500).json({ error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN" });
    }

    const preference = buildSubscriptionPreference({ plan, planInfo, user });
    const data = await mercadoPagoRequest("/checkout/preferences", { method: "POST", body: preference });

    return res.status(200).json({
      checkout_url: data.init_point,
      chosen_checkout_url: data.init_point,
      sandbox_checkout_url: data.sandbox_init_point || null,
      preference_id: data.id || null,
      plan,
      planInfo,
    });
  } catch (error) {
    console.error("create subscription preference error:", error);
    return res.status(500).json({ error: error.message || "Error creando checkout" });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
    responseLimit: "4mb",
  },
};
