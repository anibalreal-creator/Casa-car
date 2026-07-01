import { getSupabaseServer, getSupabaseUserClient } from '../../lib/supabaseServer';
import { getHouseAds, normalizeAdRecord, sortAds, getAdPlan, toPublicAdRecord } from '../../lib/adHelpers';
import { isCampaignLive, syncCampaignStatuses } from '../../lib/adCampaigns';
import { normalizeSlotKey } from '../../lib/adSlots';
import { requireAuthenticatedRoute } from '../../lib/apiRouteGuards';
import { readBearer } from '../../lib/auth';
import { isOwnerEmail, normalizeEmail } from '../../lib/owner';
import { enforceCampaignCreationLimit } from '../../lib/listingLimits';
import { checkRateLimit } from '../../lib/server/rateLimit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function canManageCampaign(campaign, user) {
  const userId = String(user?.id || '');
  const userEmail = normalizeEmail(user?.email || '');
  const campaignUserId = String(campaign?.user_id || '');
  const campaignEmail = normalizeEmail(campaign?.contact_email || campaign?.user_email || '');
  if (isOwnerEmail(userEmail)) return true;
  if (campaignUserId) return Boolean(userId && userId === campaignUserId);
  return Boolean(userEmail && campaignEmail && userEmail === campaignEmail);
}

function withHouseAds(items, slot) {
  const normalized = (items || []).map(normalizeAdRecord);
  const active = normalized.filter((item) => isCampaignLive(item) && (!slot || item.slot_key === slot));
  if (active.length) return sortAds(active).map(toPublicAdRecord);
  return sortAds(getHouseAds().filter((item) => !slot || item.slot_key === slot).map(normalizeAdRecord)).map(toPublicAdRecord);
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseServer();

  if (req.method === 'GET') {
    if (!checkRateLimit(req, res, { name: 'ads-public-read', limit: 120, windowMs: 60_000 })) return;
    const { slot } = req.query;
    const normalizedSlot = normalizeSlotKey(slot || '', '');
    try {
      let query = supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      const { data, error } = await query;
      if (error) return res.status(200).json(withHouseAds([], normalizedSlot));
      const synced = await syncCampaignStatuses(supabase, Array.isArray(data) ? data : []);
      return res.status(200).json(withHouseAds(synced || [], normalizedSlot));
    } catch {
      return res.status(200).json(withHouseAds([], normalizedSlot));
    }
  }

  if (req.method === 'POST') {
    if (!checkRateLimit(req, res, { name: 'ads-write', limit: 30, windowMs: 60_000 })) return;
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;
    const userSupabase = getSupabaseUserClient(readBearer(req));

    const campaignQuota = await enforceCampaignCreationLimit(userSupabase, user);
    if (!campaignQuota.canCreateCampaign) {
      return res.status(campaignQuota.canUseCompanyPanel ? 402 : 403).json(campaignQuota.blockedResponse);
    }

    const body = req.body || {};
    const plan = getAdPlan(body.plan_key || 'basico');
    const payload = {
      user_id: user.id,
      company_name: body.company_name || body.title || '',
      title: body.title || body.company_name || 'Campania publicitaria',
      description: body.description || '',
      plan_key: plan.key,
      slot_key: normalizeSlotKey(body.slot_key || body.slot || 'home_middle'),
      banner_url: body.banner_url || '',
      destination_url: body.destination_url || '',
      cta_text: body.cta_text || 'Ver mas',
      contact_name: body.contact_name || '',
      contact_email: body.contact_email || user.email || '',
      status: body.status || 'pending_payment',
      active: false,
      starts_at: body.starts_at || null,
      ends_at: body.ends_at || null,
      mercadopago_status: body.mercadopago_status || null,
      mercadopago_payment_id: body.mercadopago_payment_id || null,
    };

    const { data, error } = await userSupabase.from('ad_campaigns').insert(payload).select('*').single();
    if (error) return res.status(500).json({ error: 'No se pudo crear la campania' });
    return res.status(200).json(normalizeAdRecord(data));
  }

  if (req.method === 'PATCH') {
    if (!checkRateLimit(req, res, { name: 'ads-write', limit: 30, windowMs: 60_000 })) return;
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;
    const userSupabase = getSupabaseUserClient(readBearer(req));

    const campaignId = String(req.query?.id || '').trim();
    if (!campaignId || !UUID_RE.test(campaignId)) return res.status(400).json({ error: 'id invalido' });
    const body = req.body || {};

    const { data: existing, error: existingError } = await userSupabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (existingError) return res.status(500).json({ error: 'No se pudo cargar la campania' });
    if (!existing) return res.status(404).json({ error: 'Campania no encontrada' });
    if (!canManageCampaign(existing, user)) return res.status(403).json({ error: 'No autorizado' });

    const payload = {};
    ['company_name', 'title', 'description', 'plan_key', 'slot_key', 'banner_url', 'destination_url', 'cta_text', 'contact_name', 'contact_email', 'starts_at', 'ends_at'].forEach((key) => {
      if (body[key] !== undefined) payload[key] = body[key];
    });
    const { data, error } = await userSupabase.from('ad_campaigns').update(payload).eq('id', campaignId).select('*').single();
    if (error) return res.status(500).json({ error: 'No se pudo actualizar la campania' });
    return res.status(200).json(normalizeAdRecord(data));
  }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error interno creando o leyendo campanias' });
  }
}
