import { getSupabaseServer } from '../../../lib/supabaseServer';
import { getHouseAds, normalizeAdRecord, sortAds, getAdStatusFromDates, toPublicAdRecord } from '../../../lib/adHelpers';
import { normalizeSlotKey } from '../../../lib/adSlots';
import { checkRateLimit } from '../../../lib/server/rateLimit';

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
  return items.map(toPublicAdRecord);
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
        .select('id,title,company_name,plan_key,slot_key,banner_url,destination_url,cta_text,status,active,starts_at,ends_at,created_at,impressions,clicks')
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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRateLimit(req, res, { name: 'ads-active', limit: 120, windowMs: 60_000 })) return;

  const supabase = getSupabaseServer();
  const { slot = '' } = req.query || {};
  const normalizedSlot = normalizeSlotKey(slot || '', '');
  try {
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('id,title,company_name,plan_key,slot_key,banner_url,destination_url,cta_text,status,active,starts_at,ends_at,created_at,impressions,clicks')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    const synced = await syncStatuses(supabase, Array.isArray(data) ? data : []);
    const campaigns = sortAds(synced.map(normalizeAdRecord)).filter((item) => isActiveNow(item) && (!normalizedSlot || item.slot_key === normalizedSlot));
    const result = campaigns.length ? campaigns : sortAds(getHouseAds().map(normalizeAdRecord)).filter((item) => !normalizedSlot || item.slot_key === normalizedSlot);
    await registerImpressions(supabase, result);
    return res.status(200).json({ ads: shape(result) });
  } catch {
    const result = sortAds(getHouseAds().map(normalizeAdRecord)).filter((item) => !normalizedSlot || item.slot_key === normalizedSlot);
    return res.status(200).json({ ads: shape(result) });
  }
}
