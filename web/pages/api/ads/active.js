import { getSupabaseServer } from '../../../lib/supabaseServer';
import { getHouseAds, normalizeAdRecord, sortAds, getAdStatusFromDates } from '../../../lib/adHelpers';
import { normalizeSlotKey } from '../../../lib/adSlots';

function isActiveNow(item = {}) {
  const status = item.status || getAdStatusFromDates(item.starts_at, item.ends_at);
  if (!['active', 'approved', 'scheduled'].includes(String(status).toLowerCase())) return false;
  if (item.active === false && status !== 'scheduled') return false;
  const now = Date.now();
  const starts = item.starts_at ? new Date(item.starts_at).getTime() : null;
  const ends = item.ends_at ? new Date(item.ends_at).getTime() : null;
  if (starts && now < starts) return false;
  if (ends && now > ends) return false;
  return true;
}

function shape(items = []) {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    slot: item.slot_label,
    slot_key: item.slot_key,
    image: item.banner_url,
    company_name: item.company_name,
    destination_url: item.destination_url,
    cta_text: item.cta_text || 'Ver más',
    status: item.status,
    plan_key: item.plan_key,
    starts_at: item.starts_at || null,
    ends_at: item.ends_at || null,
    clicks: Number(item.clicks || 0),
    impressions: Number(item.impressions || 0),
  }));
}

async function syncStatuses(supabase, rows = []) {
  const normalized = [];
  for (const row of rows) {
    const nextStatus = getAdStatusFromDates(row.starts_at, row.ends_at);
    const nextActive = nextStatus === 'active';
    let current = { ...row };
    const currentStatus = String(row.status || '').toLowerCase();
    const currentActive = row.active === true;
    if (currentStatus !== nextStatus || currentActive !== nextActive) {
      const { data } = await supabase
        .from('ad_campaigns')
        .update({ status: nextStatus, active: nextActive })
        .eq('id', row.id)
        .select('*')
        .single();
      current = data || { ...row, status: nextStatus, active: nextActive };
    }
    normalized.push(current);
  }
  return normalized;
}

async function registerImpressions(supabase, items = []) {
  const realItems = items.filter((item) => item?.id && !String(item.id).startsWith('house-'));
  await Promise.all(
    realItems.map((item) =>
      supabase.rpc('increment_ad_impressions', { campaign_id_input: item.id }).catch(async () => {
        await supabase
          .from('ad_campaigns')
          .update({ impressions: Number(item.impressions || 0) + 1 })
          .eq('id', item.id);
      })
    )
  );
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();
  const { slot = '' } = req.query || {};
  const normalizedSlot = normalizeSlotKey(slot || '', '');
  try {
    const { data, error } = await supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const synced = await syncStatuses(supabase, Array.isArray(data) ? data : []);
    const campaigns = sortAds(synced.map(normalizeAdRecord)).filter((item) => isActiveNow(item) && (!normalizedSlot || item.slot_key === normalizedSlot));
    const result = campaigns.length ? campaigns : sortAds(getHouseAds().map(normalizeAdRecord)).filter((item) => !normalizedSlot || item.slot_key === normalizedSlot);
    await registerImpressions(supabase, result);
    return res.status(200).json({ ads: shape(result) });
  } catch (error) {
    const result = sortAds(getHouseAds().map(normalizeAdRecord)).filter((item) => !normalizedSlot || item.slot_key === normalizedSlot);
    return res.status(200).json({ ads: shape(result) });
  }
}
