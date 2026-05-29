import { requireAuthenticatedRoute } from '../../lib/apiRouteGuards';
import mercadopago from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

const PLAN_PRICES = {
  basico: 25000,
  destacado: 65000,
  premium: 145000,
};

const PLAN_DAYS = {
  basico: 7,
  destacado: 15,
  premium: 30,
};

function normalizeBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const body = normalizeBody(req);
    const {
      user_id,
      user_email = "",
      company_name = "",
      plan,
      slot,
      banner_url = "",
      link = "",
      title = "",
    } = body;

    if (!plan || !slot) {
      return res.status(400).json({ error: "Faltan plan o slot" });
    }

    const amount = PLAN_PRICES[plan];
    const duration_days = PLAN_DAYS[plan];

    if (!amount || !duration_days) {
      return res.status(400).json({ error: "Plan inválido" });
    }

    const campaignPayload = {
      user_id: user.id,
      user_email: user.email || user_email,
      company_name,
      title: title || `Campaña ${plan}`,
      plan,
      slot,
      banner_url,
      link,
      amount,
      duration_days,
      status: "pending",
    };

    const { data: inserted, error: insertError } = await supabase
      .from("ad_campaigns")
      .insert(campaignPayload)
      .select("*")
      .single();

    if (insertError) {
      console.error("Supabase insert campaign error:", insertError);
      return res.status(500).json({ error: insertError.message || "No se pudo crear la campaña" });
    }

    const campaignId = inserted.id;
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    const preference = {
      items: [
        {
          title: inserted.title,
          quantity: 1,
          currency_id: "ARS",
          unit_price: amount,
        },
      ],
      external_reference: String(campaignId),
      notification_url: `${baseUrl}/api/mp-webhook`,
      back_urls: {
        success: `${baseUrl}/publicidad/panel?status=paid&campaign=${campaignId}`,
        pending: `${baseUrl}/publicidad/panel?status=pending&campaign=${campaignId}`,
        failure: `${baseUrl}/publicidad/panel?status=failure&campaign=${campaignId}`,
      },
      auto_return: "approved",
      metadata: {
        campaign_id: String(campaignId),
        plan,
        slot,
      },
    };

    const response = await mercadopago.preferences.create(preference);
    const preferenceId = response?.body?.id || null;
    const initPoint = response?.body?.init_point || "";

    await supabase
      .from("ad_campaigns")
      .update({
        mp_preference_id: preferenceId,
        checkout_url: initPoint,
      })
      .eq("id", campaignId);

    return res.status(200).json({
      ok: true,
      campaign_id: campaignId,
      preference_id: preferenceId,
      init_point: initPoint,
    });
  } catch (error) {
    console.error("create-campaign error:", error);
    return res.status(500).json({ error: error.message || "No se pudo crear la campaña" });
  }
}
