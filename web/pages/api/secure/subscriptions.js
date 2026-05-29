import { requireUser } from "../../../lib/auth";
import { getCurrentMembership } from "../../../lib/permissions";
import { getSupabaseServer } from "../../../lib/supabaseServer";
import { isOwnerEmail, ownerMembership } from "../../../lib/owner";

const PLAN_CATALOG = {
  FREE: { price: 0, publications: 3, premiumSlots: 0, analytics: false },
  PRO: { price: 29, publications: 25, premiumSlots: 3, analytics: true },
  BUSINESS: { price: 99, publications: 200, premiumSlots: 30, analytics: true },
  OWNER_FREE: { price: 0, publications: 999999, premiumSlots: 999999, analytics: true, hidden: true },
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const user = await requireUser(req, res);
    if (!user) return;
    const current = isOwnerEmail(user.email) ? ownerMembership() : await getCurrentMembership(user.id);
    const visiblePlans = isOwnerEmail(user.email) ? PLAN_CATALOG : Object.fromEntries(Object.entries(PLAN_CATALOG).filter(([key]) => key !== "OWNER_FREE"));
    return res.status(200).json({ current, plans: visiblePlans, ownerMode: isOwnerEmail(user.email) });
  }

  if (req.method === "POST") {
    const user = await requireUser(req, res);
    if (!user) return;
    const body = req.body || {};
    const plan = String(body.plan || "FREE").toUpperCase();
    const ownerMode = isOwnerEmail(user.email);
    if (!PLAN_CATALOG[plan]) return res.status(400).json({ error: "Plan inválido" });
    if (plan === "OWNER_FREE" && !ownerMode) return res.status(403).json({ error: "Plan oculto" });

    const payload = {
      user_id: user.id,
      plan,
      active: ownerMode ? true : plan !== "FREE",
      expires_at: plan === "OWNER_FREE" ? null : (body.expires_at || new Date(Date.now() + 30*24*60*60*1000).toISOString()),
    };

    try {
      const supabase = getSupabaseServer();
      const { data, error } = await supabase.from("subscriptions").upsert(payload, { onConflict: "user_id" }).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ subscription: data, planInfo: PLAN_CATALOG[plan], ownerMode });
    } catch (error) {
      return res.status(500).json({ error: error.message || "No se pudo guardar el plan" });
    }
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
