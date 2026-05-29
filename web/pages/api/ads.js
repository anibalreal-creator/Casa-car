import { getSupabaseServer } from '../../lib/supabaseServer';
import { getHouseAds, normalizeAdRecord, sortAds, getAdPlan } from '../../lib/adHelpers';
import { normalizeSlotKey } from '../../lib/adSlots';
import { requireAuthenticatedRoute } from '../../lib/apiRouteGuards';
import { isOwnerEmail, normalizeEmail } from '../../lib/owner';

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
  const active = normalized.filter((item) => item.status === 'active' && (!slot || item.slot_key === slot));
  if (active.length) return sortAds(active);
  return sortAds(getHouseAds().filter((item) => !slot || item.slot_key === slot).map(normalizeAdRecord));
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  if (req.method === 'GET') {
    const { slot, company, contact_email } = req.query;
    const normalizedSlot = normalizeSlotKey(slot || '', '');
    try {
      let query = supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false });
      if (normalizedSlot) query = query.eq('slot_key', normalizedSlot);
      if (company) query = query.ilike('company_name', `%${company}%`);
      if (contact_email) query = query.eq('contact_email', contact_email);
      const { data, error } = await query;
      if (error) {
        return res.status(200).json(withHouseAds([], normalizedSlot));
      }
      return res.status(200).json(withHouseAds(data || [], normalizedSlot));
    } catch {
      return res.status(200).json(withHouseAds([], normalizedSlot));
    }
  }

  if (req.method === 'POST') {
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const body = req.body || {};
    const plan = getAdPlan(body.plan_key || 'basico');
    const startsAt = body.starts_at || null;
    const endsAt = body.ends_at || null;
    const payload = {
      user_id: user.id,
      company_name: body.company_name || body.title || '',
      title: body.title || body.company_name || 'Campaña publicitaria',
      description: body.description || '',
      plan_key: plan.key,
      slot_key: normalizeSlotKey(body.slot_key || body.slot || 'home_middle'),
      banner_url: body.banner_url || '',
      destination_url: body.destination_url || '',
      cta_text: body.cta_text || 'Ver más',
      contact_name: body.contact_name || '',
      contact_email: body.contact_email || user.email || '',
      status: body.status || 'pending_payment',
      active: false,
      starts_at: startsAt,
      ends_at: endsAt,
      mercadopago_status: body.mercadopago_status || null,
      mercadopago_payment_id: body.mercadopago_payment_id || null,
    };

    const { data, error } = await supabase.from('ad_campaigns').insert(payload).select('*').single();
    if (error) {
      return res.status(500).json({
        error: error.message,
        hint: 'Ejecutá la migración supabase/migrations/20260318_ads_system.sql para habilitar campañas publicitarias.',
      });
    }
    return res.status(200).json(normalizeAdRecord(data));
  }

  if (req.method === 'PATCH') {
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const { id } = req.query;
    const body = req.body || {};
    const { data: existing, error: existingError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (existingError) return res.status(500).json({ error: existingError.message });
    if (!existing) return res.status(404).json({ error: 'Campania no encontrada' });
    if (!canManageCampaign(existing, user)) return res.status(403).json({ error: 'No autorizado' });

    const payload = {};
    ['company_name','title','description','plan_key','slot_key','banner_url','destination_url','cta_text','contact_name','contact_email','starts_at','ends_at'].forEach((key) => {
      if (body[key] !== undefined) payload[key] = body[key];
    });
    const { data, error } = await supabase.from('ad_campaigns').update(payload).eq('id', id).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(normalizeAdRecord(data));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
