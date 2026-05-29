import { requireUser } from '../../../../lib/auth';
import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { addDays, getPlanDurationDays } from '../../../../lib/adPlans';

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabaseServer();

  try {
    const { campaignId } = req.body || {};
    if (!campaignId) return res.status(400).json({ error: 'Falta campaignId' });

    const { data: campaign, error: readError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (readError) throw readError;

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
    return res.status(500).json({ error: error.message });
  }
}
