import { getSupabaseServer } from '../../../lib/supabaseServer';
import { checkRateLimit } from '../../../lib/server/rateLimit';
import { allowMethods, safeJson } from '../../../lib/server/internalApi';
import { isCampaignLive } from '../../../lib/campaignStatus';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!checkRateLimit(req, res, { name: 'ads-impression-legacy', limit: 180, windowMs: 60_000 })) return;

  try {
    const campaignId = String(req.body?.campaignId || '').trim();
    if (!campaignId || campaignId.startsWith('house-')) return safeJson(res, 200, { ok: true, ignored: true });
    if (!UUID_RE.test(campaignId)) return safeJson(res, 400, { error: 'campaignId invalido' });

    const supabase = getSupabaseServer();
    const { data: campaign, error: readError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (readError || !campaign || !isCampaignLive(campaign)) return safeJson(res, 200, { ok: true, ignored: true });

    await supabase.from('analytics_events').insert({
      event_type: 'impression',
      campaign_id: campaignId,
      slot: String(req.body?.slot || '').slice(0, 80) || null,
      page: String(req.body?.page || '').slice(0, 120) || null,
      created_at: new Date().toISOString(),
    });

    return safeJson(res, 200, { ok: true });
  } catch {
    return safeJson(res, 200, { ok: true });
  }
}
