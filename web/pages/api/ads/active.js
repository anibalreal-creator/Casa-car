import { getSupabaseServer } from '../../../lib/supabaseServer';
import { getHouseAds, normalizeAdRecord, sortAds, toPublicAdRecord } from '../../../lib/adHelpers';
import { isCampaignLive, syncCampaignStatuses } from '../../../lib/adCampaigns';
import { normalizeSlotKey } from '../../../lib/adSlots';
import { checkRateLimit } from '../../../lib/server/rateLimit';

function shape(items = []) {
  return items.map(toPublicAdRecord);
}

async function registerImpressions(supabase, items = []) {
  const realItems = items.filter((item) => item?.id && !String(item.id).startsWith('house-'));
  await Promise.all(
    realItems.map(async (item) => {
      try {
        const { error } = await supabase.rpc('increment_ad_impressions', { campaign_id_input: item.id });
        if (!error) return;
        await supabase
          .from('ad_campaigns')
          .update({ impressions: Number(item.impressions || 0) + 1 })
          .eq('id', item.id);
      } catch {
        // Impression tracking must never hide a live ad.
      }
    })
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRateLimit(req, res, { name: 'ads-active', limit: 120, windowMs: 60_000 })) return;

  const supabase = getSupabaseServer();
  const { slot = '' } = req.query || {};
  const normalizedSlot = normalizeSlotKey(slot || '', '');
  try {
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    const synced = await syncCampaignStatuses(supabase, Array.isArray(data) ? data : []);
    const campaigns = sortAds(synced.map(normalizeAdRecord)).filter((item) => isCampaignLive(item) && (!normalizedSlot || item.slot_key === normalizedSlot));
    const result = campaigns.length ? campaigns : sortAds(getHouseAds().map(normalizeAdRecord)).filter((item) => !normalizedSlot || item.slot_key === normalizedSlot);
    registerImpressions(supabase, result).catch(() => {});
    return res.status(200).json({ ads: shape(result) });
  } catch {
    const result = sortAds(getHouseAds().map(normalizeAdRecord)).filter((item) => !normalizedSlot || item.slot_key === normalizedSlot);
    return res.status(200).json({ ads: shape(result) });
  }
}
