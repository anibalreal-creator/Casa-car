import { getSupabaseServer } from '../../../lib/supabaseServer';
import { getAdPlan, getAdStatusFromDates } from '../../../lib/adHelpers';
import { requireResourceOwner } from '../../../lib/apiRouteGuards';
import { isOwnerEmail } from '../../../lib/owner';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const supabase = getSupabaseServer();
    const { campaignId = '' } = req.body || {};
    if (!campaignId) return res.status(400).json({ error: 'Falta campaignId' });

    const { data, error } = await supabase.from('ad_campaigns').select('*').eq('id', campaignId).single();
    if (error || !data) return res.status(404).json({ error: 'Campaña no encontrada' });

    const user = await requireResourceOwner(req, res, async () => data);
    if (!user) return;
    if (!isOwnerEmail(user.email)) {
      return res.status(402).json({ error: 'Renovar publicidad requiere pago.', requiresPayment: true });
    }

    const plan = getAdPlan(data.plan_key || 'basico');
    const now = new Date();
    const currentEnd = data.ends_at ? new Date(data.ends_at) : null;
    const base = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
    const startsAt = currentEnd && currentEnd.getTime() > now.getTime() && data.starts_at ? data.starts_at : now.toISOString();
    const nextEnd = new Date(base.getTime());
    nextEnd.setDate(nextEnd.getDate() + Number(plan.durationDays || 7));
    const endsAt = nextEnd.toISOString();
    const status = getAdStatusFromDates(startsAt, endsAt);
    const active = status === 'active';

    const { data: updated, error: updateError } = await supabase
      .from('ad_campaigns')
      .update({ starts_at: startsAt, ends_at: endsAt, status, active })
      .eq('id', campaignId)
      .select('*')
      .single();

    if (updateError) throw updateError;
    return res.status(200).json({ ok: true, campaign: updated, message: `Campaña renovada por ${plan.durationDays} días.` });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'No se pudo renovar la campaña' });
  }
}
