import { requireUser } from '../../../../lib/auth';
import { canManageCompany } from '../../../../lib/permissions';
import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { isOwnerEmail } from '../../../../lib/owner';
import { getAdPlan } from '../../../../data/adPlans';
import { normalizeSlotKey } from '../../../../lib/adSlots';
import { parseOrThrow, campaignSchema } from '../../../../lib/validation';
import { patchForCampaignAction, addDaysIso } from '../../../../lib/campaignStatus';
import { enforceCampaignCreationLimit } from '../../../../lib/listingLimits';

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const allowed = await canManageCompany(user.id, user.email);
  if (!allowed) return res.status(403).json({ error: 'Tu cuenta no tiene rol empresa o plan activo' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabaseServer();

  try {
    const campaignQuota = await enforceCampaignCreationLimit(supabase, user);
    if (!campaignQuota.canCreateCampaign) {
      return res.status(campaignQuota.canUseCompanyPanel ? 402 : 403).json(campaignQuota.blockedResponse);
    }

    const body = parseOrThrow(campaignSchema, req.body || {});
    const plan = getAdPlan(String(body.plan_key || body.plan || 'basico').toLowerCase());
    const startsAt = body.starts_at || new Date().toISOString();
    const endsAt = body.ends_at || addDaysIso(plan.durationDays || 7, startsAt);
    const normalizedSlot = normalizeSlotKey(body.slot_key || body.slot || 'home_middle');
    const ownerMode = isOwnerEmail(user.email);

    const payload = {
      user_id: user.id,
      name: body.name || body.title || 'Campaña nueva',
      title: body.title || body.name || 'Campaña nueva',
      company_name: body.company_name || body.name || '',
      plan: String(plan.key || 'basico').toUpperCase(),
      plan_key: plan.key,
      budget: Number(body.budget || plan.price || 0),
      start_date: startsAt,
      end_date: endsAt,
      starts_at: startsAt,
      ends_at: endsAt,
      status: ownerMode ? 'active' : 'pending_payment',
      active: ownerMode,
      is_active: ownerMode,
      slot: normalizedSlot,
      slot_key: normalizedSlot,
      target_url: body.target_url || body.destination_url || '',
      destination_url: body.destination_url || body.target_url || '',
      banner_url: body.banner_url || '',
      notes: body.notes || '',
      contact_name: body.contact_name || '',
      contact_email: user.email || body.contact_email || '',
      cta_text: body.cta_text || 'Ver más',
    };

    const { data, error } = await supabase.from('ad_campaigns').insert(payload).select('*').single();
    if (error) return res.status(500).json({ error: error.message });

    if (ownerMode) {
      const patch = patchForCampaignAction(data, 'activate');
      await supabase.from('ad_campaigns').update({ ...patch, mercadopago_status: 'owner_free' }).eq('id', data.id);
      return res.status(200).json({ ...data, ...patch, mercadopago_status: 'owner_free' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'No se pudo crear la campaña',
      details: error.details || null,
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
