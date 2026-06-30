import { requireAuthenticatedRoute } from '../../lib/apiRouteGuards';
import { getSiteUrl } from '../../lib/siteUrl';
import { mercadoPagoRequest } from '../../lib/mercadopago';
import { enforceCampaignCreationLimit } from '../../lib/listingLimits';
import { checkRateLimit } from '../../lib/server/rateLimit';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLAN_PRICES = {
  basico: 500,
  destacado: 1000,
  premium: 1500,
};

const PLAN_DAYS = {
  basico: 7,
  destacado: 15,
  premium: 30,
};

function normalizeBody(req) {
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return req.body || {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRateLimit(req, res, { name: 'campaign-checkout', limit: 20, windowMs: 60_000 })) return;

  try {
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const body = normalizeBody(req);
    const {
      user_email = '',
      company_name = '',
      plan,
      slot,
      banner_url = '',
      link = '',
      title = '',
    } = body;

    if (!plan || !slot) return res.status(400).json({ error: 'Faltan plan o slot' });

    const amount = PLAN_PRICES[plan];
    const duration_days = PLAN_DAYS[plan];
    if (!amount || !duration_days) return res.status(400).json({ error: 'Plan invalido' });

    const campaignQuota = await enforceCampaignCreationLimit(supabase, user);
    if (!campaignQuota.canCreateCampaign) {
      return res.status(campaignQuota.canUseCompanyPanel ? 402 : 403).json(campaignQuota.blockedResponse);
    }

    const campaignPayload = {
      user_id: user.id,
      company_name,
      title: title || `Campania ${plan}`,
      plan_key: plan,
      slot,
      slot_key: slot,
      banner_url,
      destination_url: link,
      contact_email: user.email || user_email,
      status: 'pending_payment',
      active: false,
      impressions: 0,
      clicks: 0,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('ad_campaigns')
      .insert(campaignPayload)
      .select('id,title')
      .single();

    if (insertError) {
      console.error('campaign insert failed');
      return res.status(500).json({ error: 'No se pudo crear la campania' });
    }

    const campaignId = inserted.id;
    const baseUrl = getSiteUrl();
    const preference = {
      items: [
        {
          title: inserted.title,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: amount,
        },
      ],
      external_reference: String(campaignId),
      notification_url: `${baseUrl}/api/mp-webhook`,
      back_urls: {
        success: `${baseUrl}/publicidad/panel?status=paid&campaign=${campaignId}`,
        pending: `${baseUrl}/publicidad/panel?status=pending&campaign=${campaignId}`,
        failure: `${baseUrl}/publicidad/panel?status=failure&campaign=${campaignId}`,
      },
      auto_return: 'approved',
      metadata: {
        campaign_id: String(campaignId),
        plan,
        slot,
      },
    };

    const response = await mercadoPagoRequest('/checkout/preferences', { method: 'POST', body: preference });
    const preferenceId = response?.id || null;
    const initPoint = response?.init_point || '';

    await supabase
      .from('ad_campaigns')
      .update({
        mercadopago_status: preferenceId ? 'preference_created' : null,
      })
      .eq('id', campaignId);

    return res.status(200).json({
      ok: true,
      campaign_id: campaignId,
      preference_id: preferenceId,
      init_point: initPoint,
    });
  } catch (error) {
    console.error('campaign checkout failed');
    return res.status(500).json({ error: 'No se pudo crear la campania' });
  }
}
