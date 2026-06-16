import { getSupabaseServer } from '../../lib/supabaseServer';
import { extractCampaignId } from '../../lib/adHelpers';
import { patchForCampaignAction } from '../../lib/campaignStatus';
import { mercadoPagoRequest } from '../../lib/mercadopago';
import { enforceCampaignActivationLimit } from '../../lib/listingLimits';

function normalizeExternalReference(value) {
  const normalized = extractCampaignId(value);
  return normalized || null;
}

function pickCampaignId(body = {}) {
  return (
    normalizeExternalReference(body.external_reference) ||
    normalizeExternalReference(body.campaign_id) ||
    normalizeExternalReference(body.data?.external_reference) ||
    normalizeExternalReference(body.resource?.external_reference) ||
    normalizeExternalReference(body.metadata?.campaign_id) ||
    normalizeExternalReference(body.additional_info?.items?.[0]?.id) ||
    null
  );
}

function pickDataId(body = {}, query = {}) {
  return body?.data?.id || body?.id || query?.['data.id'] || query?.id || null;
}

function pickProviderStatus(body = {}) {
  const values = [
    body.status,
    body.action,
    body.type,
    body.data?.status,
    body.resource?.status,
    body.payment?.status,
  ];
  return String(values.find(Boolean) || 'received').trim().toLowerCase();
}

function mapStatus(status = '') {
  const value = String(status || '').toLowerCase();
  if (['approved', 'accredited', 'paid', 'payment.created', 'payment.updated'].includes(value)) return 'approved';
  if (['pending', 'in_process', 'authorized', 'waiting_for_capture'].includes(value)) return 'pending';
  if (['rejected', 'cancelled', 'canceled', 'refunded', 'charged_back'].includes(value)) return 'rejected';
  return 'received';
}

async function getPaymentDetails(body, query) {
  const dataId = pickDataId(body, query);
  if (!dataId) return null;
  const type = String(body.type || query.type || '').toLowerCase();
  if (type && type !== 'payment') return null;
  return mercadoPagoRequest(`/v1/payments/${dataId}`);
}

async function insertPaymentEvent(supabase, payload) {
  const attempts = [
    {
      campaign_id: payload.campaign_id,
      provider: 'mercadopago',
      event_type: payload.event_type,
      provider_payment_id: payload.provider_payment_id,
      status: payload.status,
      payload_json: payload.payload_json,
      created_at: payload.created_at,
    },
    {
      campaign_id: payload.campaign_id,
      provider: 'mercadopago',
      event_type: payload.event_type,
      external_id: payload.provider_payment_id,
      status: payload.status,
      payload: payload.payload_json,
      created_at: payload.created_at,
    },
  ];

  for (const attempt of attempts) {
    const { error } = await supabase.from('payment_events').insert(attempt);
    if (!error) return true;
  }
  return false;
}

async function updateCampaign(supabase, campaignId, patch) {
  const attempts = [
    patch,
    Object.fromEntries(Object.entries(patch).filter(([key]) => key !== 'mercadopago_payment_id' && key !== 'approved_at')),
    Object.fromEntries(Object.entries(patch).filter(([key]) => key !== 'is_active' && key !== 'mercadopago_payment_id' && key !== 'approved_at')),
    Object.fromEntries(Object.entries(patch).filter(([key]) => key !== 'active' && key !== 'mercadopago_payment_id' && key !== 'approved_at')),
  ];

  let lastError = null;
  for (const attempt of attempts) {
    const { error } = await supabase.from('ad_campaigns').update(attempt).eq('id', campaignId);
    if (!error) return null;
    lastError = error;
  }
  return lastError;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabaseServer();
  const body = req.body || {};
  let paymentDetails = null;
  let paymentLookupError = null;
  try {
    paymentDetails = await getPaymentDetails(body, req.query || {});
  } catch (error) {
    paymentLookupError = error;
  }
  const eventPayload = paymentDetails || body;
  const providerStatus = pickProviderStatus(paymentDetails || body);
  const mappedStatus = mapStatus(providerStatus);
  const campaignId = pickCampaignId(paymentDetails || {}) || pickCampaignId(body);
  const providerPaymentId = String(paymentDetails?.id || pickDataId(body, req.query || '') || body.id || '');

  if (!campaignId) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'Sin campaignId/external_reference' });
  }

  if (['approved', 'pending', 'rejected'].includes(mappedStatus) && !paymentDetails) {
    await insertPaymentEvent(supabase, {
      campaign_id: campaignId,
      external_id: String(body.id || body.data?.id || body.resource?.id || ''),
      provider_payment_id: providerPaymentId,
      status: paymentLookupError ? 'lookup_error' : 'ignored_unverified',
      event_type: 'payment_webhook_unverified',
      payload_json: {
        body,
        query: req.query,
        error: paymentLookupError?.message || null,
      },
      created_at: new Date().toISOString(),
    });

    if (paymentLookupError && pickDataId(body, req.query || {})) {
      return res.status(502).json({ ok: false, error: 'No se pudo verificar el pago en Mercado Pago' });
    }

    return res.status(200).json({ ok: true, skipped: true, reason: 'Pago no verificado en Mercado Pago' });
  }

  const { data: campaign, error: campaignError } = await supabase
    .from('ad_campaigns')
    .select('*')
    .eq('id', campaignId)
    .maybeSingle();

  if (campaignError) {
    return res.status(500).json({ error: campaignError.message });
  }
  if (!campaign) {
    return res.status(404).json({ error: 'Campaña no encontrada' });
  }

  await insertPaymentEvent(supabase, {
    campaign_id: campaignId,
    external_id: String(body.id || body.data?.id || body.resource?.id || ''),
    provider_payment_id: providerPaymentId,
    status: providerStatus || 'received',
    event_type: 'payment_webhook',
    payload_json: { body, query: req.query, payment: paymentDetails },
    created_at: new Date().toISOString(),
  });

  if (mappedStatus === 'approved') {
    if (campaign.user_id) {
      const activationQuota = await enforceCampaignActivationLimit(supabase, {
        id: campaign.user_id,
        email: campaign.contact_email || campaign.user_email || '',
      }, {
        campaignId,
        alreadyActive: Boolean(campaign.active || campaign.is_active || String(campaign.status || '').toLowerCase() === 'active'),
      });

      if (!activationQuota.canActivateCampaign) {
        const blockedAt = new Date().toISOString();
        await updateCampaign(supabase, campaignId, {
          status: 'paused',
          active: false,
          is_active: false,
          mercadopago_status: 'approved_limit_blocked',
          mercadopago_payment_id: providerPaymentId || null,
          approved_at: blockedAt,
        });
        return res.status(200).json({
          ok: true,
          campaignId,
          providerStatus,
          mappedStatus,
          skipped: true,
          reason: activationQuota.blockedResponse?.reason || 'active_campaign_limit',
        });
      }
    }

    const patch = patchForCampaignAction(campaign, 'activate');
    const updateError = await updateCampaign(supabase, campaignId, {
      ...patch,
      mercadopago_status: providerStatus || 'approved',
      mercadopago_payment_id: providerPaymentId || null,
      approved_at: patch.approved_at || new Date().toISOString(),
    });

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
  } else if (mappedStatus === 'pending') {
    const updateError = await updateCampaign(supabase, campaignId, {
      status: 'pending_payment',
      active: false,
      is_active: false,
      mercadopago_status: providerStatus || 'pending',
      mercadopago_payment_id: providerPaymentId || null,
    });

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
  } else if (mappedStatus === 'rejected') {
    const updateError = await updateCampaign(supabase, campaignId, {
      status: 'paused',
      active: false,
      is_active: false,
      mercadopago_status: providerStatus || 'rejected',
      mercadopago_payment_id: providerPaymentId || null,
    });

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
  }

  return res.status(200).json({ ok: true, campaignId, providerStatus, mappedStatus });
}
