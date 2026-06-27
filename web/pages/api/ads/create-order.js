import { getSupabaseServer } from '../../../lib/supabaseServer';
import { buildAdPreference, getAdPlan } from '../../../lib/adHelpers';
import { isOwnerEmail, normalizeEmail } from '../../../lib/owner';
import { patchForCampaignAction } from '../../../lib/campaignStatus';
import { allowMethods, requireInternalRequest, safeJson } from '../../../lib/server/internalApi';
import { requireAuthenticatedRoute } from '../../../lib/apiRouteGuards';
import { enforceCampaignActivationLimit } from '../../../lib/listingLimits';

function getBaseUrl(req) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '';
  if (envUrl) return envUrl.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireInternalRequest(req, res)) return;
  try {
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const supabase = getSupabaseServer();
    const { campaignId = '', title = '', planKey = 'basico', slotKey = 'home_middle', companyName = '' } = req.body || {};
    if (!campaignId) return safeJson(res, 400, { error: 'Falta campaignId' });

    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) return safeJson(res, 404, { error: 'Campaña no encontrada' });

    const userEmail = normalizeEmail(user.email || '');
    const campaignEmail = normalizeEmail(campaign.contact_email || campaign.user_email || '');
    const campaignUserId = String(campaign.user_id || '');
    const isCampaignOwner = isOwnerEmail(userEmail)
      ? true
      : campaignUserId
        ? campaignUserId === String(user.id)
        : Boolean(campaignEmail && campaignEmail === userEmail);

    if (!isCampaignOwner) return safeJson(res, 403, { error: 'No autorizado' });

    const activationQuota = await enforceCampaignActivationLimit(supabase, user, {
      campaignId,
      alreadyActive: Boolean(campaign.active || campaign.is_active || String(campaign.status || '').toLowerCase() === 'active'),
    });
    if (!activationQuota.canActivateCampaign) {
      return safeJson(res, activationQuota.canUseCompanyPanel ? 402 : 403, activationQuota.blockedResponse);
    }

    if (isOwnerEmail(userEmail) || isOwnerEmail(campaignEmail)) {
      const patch = patchForCampaignAction(campaign, 'activate');
      await supabase.from('ad_campaigns').update({ ...patch, mercadopago_status: 'owner_free' }).eq('id', campaignId);
      return safeJson(res, 200, { ok: true, ownerFree: true, campaignId, chosen_checkout_url: `${getBaseUrl(req)}/dashboard/company` });
    }

    const plan = getAdPlan(campaign.plan_key || planKey);
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (!mpToken) {
      return safeJson(res, 200, { ok: true, manual: true, campaignId, planKey: plan.key, amount: plan.price, message: 'Falta Mercado Pago. Campaña guardada en pending_payment.' });
    }

    const preference = buildAdPreference({
      campaign: {
        id: campaignId,
        title: campaign.title || title,
        plan_key: plan.key,
        slot_key: campaign.slot_key || slotKey,
        company_name: campaign.company_name || companyName,
      },
      baseUrl: getBaseUrl(req),
    });

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preference),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return safeJson(res, response.status, { error: 'No se pudo crear la orden' });

    await supabase.from('ad_campaigns').update({ mercadopago_status: 'preference_created', mp_preference_id: data.id || null }).eq('id', campaignId);
    return safeJson(res, 200, { ok: true, checkout_url: data.init_point, chosen_checkout_url: data.init_point, sandbox_url: data.sandbox_init_point || null });
  } catch (error) {
    return safeJson(res, 500, { error: 'No se pudo crear la orden publicitaria' });
  }
}
