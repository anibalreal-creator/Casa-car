import { getSupabaseServer } from '../../../lib/supabaseServer';
import { allowMethods, safeJson } from '../../../lib/server/internalApi';
import { checkRateLimit } from '../../../lib/server/rateLimit';
import { isCampaignLive } from '../../../lib/campaignStatus';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function bumpCounter(supabase, campaignId, field) {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select(`${field},status,active,starts_at,ends_at`)
    .eq('id', campaignId)
    .maybeSingle();
  if (error || !data) return null;

  if (!isCampaignLive(data)) return null;

  const next = Number(data?.[field] || 0) + 1;
  const { error: updateError } = await supabase
    .from('ad_campaigns')
    .update({ [field]: next })
    .eq('id', campaignId);
  if (updateError) return null;
  return { [field]: next };
}

async function insertAnalyticsEvent(supabase, { campaignId, eventType, slot, page }) {
  const now = new Date().toISOString();
  const attempts = [
    {
      event_name: `ad_${eventType}`,
      entity_type: 'ad_campaign',
      entity_id: campaignId,
      meta: { slot, page },
      created_at: now,
    },
    {
      campaign_id: campaignId,
      event_type: eventType,
      slot,
      page,
      created_at: now,
    },
    {
      ad_campaign_id: campaignId,
      event_type: eventType,
      slot,
      page,
      created_at: now,
    },
  ];

  for (const payload of attempts) {
    const { error } = await supabase.from('analytics_events').insert(payload);
    if (!error) return true;
  }
  return false;
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!checkRateLimit(req, res, { name: 'ads-track', limit: 240, windowMs: 60_000 })) return;

  try {
    const supabase = getSupabaseServer();
    const body = getBody(req);
    const campaignId = String(body?.campaignId || body?.campaign_id || '').trim();
    const rawType = String(body?.eventType || body?.event_type || body?.type || 'impression').trim().toLowerCase();
    const eventType = rawType === 'click' ? 'click' : 'impression';
    const slot = String(body?.slot || '').trim();
    const page = String(body?.page || '').trim();

    if (!campaignId) {
      return safeJson(res, 400, { error: 'campaignId requerido' });
    }
    if (campaignId.startsWith('house-')) {
      return safeJson(res, 200, { ok: true, ignored: true, reason: 'house_ad' });
    }
    if (!UUID_RE.test(campaignId)) {
      return safeJson(res, 400, { error: 'campaignId invalido' });
    }

    const field = eventType === 'click' ? 'clicks' : 'impressions';
    const counter = await bumpCounter(supabase, campaignId, field);
    if (!counter) return safeJson(res, 200, { ok: true, ignored: true });

    try {
      await insertAnalyticsEvent(supabase, { campaignId, eventType, slot, page });
    } catch {}

    return safeJson(res, 200, {
      ok: true,
      campaignId,
      eventType,
      slot,
      page,
      ...counter,
    });
  } catch (error) {
    return safeJson(res, 200, { ok: true });
  }
}
