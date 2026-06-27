import { getSupabaseServer } from '../../../lib/supabaseServer';
import { normalizeAdRecord } from '../../../lib/adHelpers';
import { deriveCampaignState } from '../../../lib/campaignStatus';
import { allowMethods, requireInternalRequest, safeJson } from '../../../lib/server/internalApi';
import { requireAdminRoute } from '../../../lib/apiRouteGuards';

function ctr(impressions = 0, clicks = 0) {
  const imp = Number(impressions || 0);
  const clk = Number(clicks || 0);
  return imp > 0 ? Number(((clk / imp) * 100).toFixed(2)) : 0;
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireInternalRequest(req, res)) return;
  const admin = await requireAdminRoute(req, res, { allowLocalDev: false });
  if (!admin) return;

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) throw error;

    const campaigns = (data || []).map(normalizeAdRecord).map((item) => {
      const derived = deriveCampaignState(item);
      const clicks = Number(item.clicks || 0);
      const impressions = Number(item.impressions || 0);
      return { ...item, status: derived.status, active: derived.active, ctr: ctr(impressions, clicks) };
    });

    const clicks = campaigns.reduce((acc, item) => acc + Number(item.clicks || 0), 0);
    const impressions = campaigns.reduce((acc, item) => acc + Number(item.impressions || 0), 0);

    return safeJson(res, 200, {
      ok: true,
      summary: {
        totalCampaigns: campaigns.length,
        active: campaigns.filter((x) => x.active || x.status === 'active').length,
        pending: campaigns.filter((x) => String(x.status).includes('pending')).length,
        paused: campaigns.filter((x) => x.status === 'paused').length,
        expired: campaigns.filter((x) => x.status === 'expired').length,
        scheduled: campaigns.filter((x) => x.status === 'scheduled').length,
        clicks,
        impressions,
        ctr: ctr(impressions, clicks),
      },
      campaigns,
    });
  } catch (error) {
    return safeJson(res, 500, { error: 'No se pudo cargar el resumen', summary: null, campaigns: [] });
  }
}
