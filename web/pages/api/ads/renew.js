import { getSupabaseServer } from '../../../lib/supabaseServer';
import { getAdPlan, getAdStatusFromDates } from '../../../lib/adHelpers';
import { requireResourceOwner } from '../../../lib/apiRouteGuards';
import { isOwnerEmail } from '../../../lib/owner';
import { checkRateLimit } from '../../../lib/server/rateLimit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRateLimit(req, res, { name: 'ads-renew', limit: 20, windowMs: 60_000 })) return;

  try {
    const supabase = getSupabaseServer();
    const campaignId = String(req.body?.campaignId || '').trim();
    if (!campaignId || !UUID_RE.test(campaignId)) return res.status(400).json({ error: 'campaignId invalido' });

    const { data, error } = await supabase.from('ad_campaigns').select('*').eq('id', campaignId).single();
    if (error || !data) return res.status(404).json({ error: 'Campania no encontrada' });

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

    if (updateError) return res.status(500).json({ error: 'No se pudo renovar la campania' });
    return res.status(200).json({ ok: true, campaign: updated, message: `Campania renovada por ${plan.durationDays} dias.` });
  } catch {
    return res.status(500).json({ error: 'No se pudo renovar la campania' });
  }
}
