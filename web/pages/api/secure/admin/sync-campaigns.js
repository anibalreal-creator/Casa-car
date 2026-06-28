import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { buildCampaignStatePatch } from '../../../../lib/campaignStatus';
import { requireAdminRoute } from '../../../../lib/apiRouteGuards';

async function syncCampaigns() {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.from('ad_campaigns').select('*');
  if (error) throw error;

  let updated = 0;
  for (const campaign of data || []) {
    const patch = buildCampaignStatePatch(campaign);
    if (Object.keys(patch).length) {
      const { error: updateError } = await supabase.from('ad_campaigns').update(patch).eq('id', campaign.id);
      if (!updateError) updated += 1;
    }
  }
  return { ok: true, updated, total: (data || []).length };
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const admin = await requireAdminRoute(req, res, { allowLocalDev: false });
  if (!admin) return;
  try {
    const result = await syncCampaigns();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'No se pudieron sincronizar campanias' });
  }
}
