import { getSupabaseServer } from '../../../lib/supabaseServer';
import { checkRateLimit } from '../../../lib/server/rateLimit';
import { allowMethods, safeJson } from '../../../lib/server/internalApi';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!checkRateLimit(req, res, { name: 'ad-track-click', limit: 120, windowMs: 60_000 })) return;

  try {
    const campaignId = String(req.body?.campaignId || '').trim();
    if (!campaignId || campaignId.startsWith('house-')) return safeJson(res, 200, { ok: true, ignored: true });
    if (!UUID_RE.test(campaignId)) return safeJson(res, 400, { error: 'campaignId invalido' });

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('clicks,status,active')
      .eq('id', campaignId)
      .maybeSingle();
    if (error || !data || data.active === false) return safeJson(res, 200, { ok: true, ignored: true });

    const current = Number(data.clicks || 0);
    await supabase.from('ad_campaigns').update({ clicks: current + 1 }).eq('id', campaignId);
    return safeJson(res, 200, { ok: true });
  } catch {
    return safeJson(res, 200, { ok: true });
  }
}
