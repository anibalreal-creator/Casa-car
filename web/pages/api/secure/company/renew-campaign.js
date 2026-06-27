import { requireUser } from '../../../../lib/auth';
import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { addDays, getPlanDurationDays } from '../../../../lib/adPlans';
import { isOwnerEmail } from '../../../../lib/owner';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabaseServer();

  try {
    const { campaignId } = req.body || {};
    if (!campaignId) return res.status(400).json({ error: 'Falta campaignId' });
    if (!UUID_RE.test(String(campaignId))) return res.status(400).json({ error: 'Campania invalida' });

    const { data: campaign, error: readError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (readError) throw readError;
    if (!isOwnerEmail(user.email)) {
      return res.status(402).json({ error: 'Renovar publicidad requiere pago.', requiresPayment: true });
    }

    const startsAt = new Date().toISOString();
    const days = getPlanDurationDays(campaign.plan_key || campaign.plan || campaign.plan_name) || 7;
    const endsAt = addDays(startsAt, days);

    const { data, error } = await supabase
      .from('ad_campaigns')
      .update({
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'active',
        active: true,
      })
      .eq('id', campaignId)
      .select('*')
      .single();

    if (error) throw error;

    return res.status(200).json({ ok: true, campaign: data });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo renovar la campania' });
  }
}
