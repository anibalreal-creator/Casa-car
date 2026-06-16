import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { mercadoPagoRequest } from '../../../../lib/mercadopago';
import { mirrorFeaturedState } from '../../../../lib/featuredHelpers';

function getListingIdFromExternalReference(value) {
  if (!value) return null;
  const text = String(value);
  if (text.startsWith('listing:')) return text.replace('listing:', '').trim();
  return text.trim();
}

function plusDaysIso(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 30));
  return date.toISOString();
}

function getSubscriptionFromPayment(payment) {
  const metadata = payment?.metadata || {};
  const externalReference = String(payment?.external_reference || '');
  const parts = externalReference.startsWith('subscription:') ? externalReference.split(':') : [];
  const userId = metadata.user_id || parts[1] || null;
  const plan = String(metadata.subscription_plan || parts[2] || '').trim().toUpperCase();

  if (!userId || !['PRO', 'BUSINESS'].includes(plan)) return null;
  return { userId: String(userId), plan };
}

async function activateSubscription(supabase, { userId, plan, paymentId, payment }) {
  const nowIso = new Date().toISOString();
  const expiresAt = plusDaysIso(30);
  const basePayload = {
    user_id: userId,
    plan,
    active: true,
    status: 'active',
    started_at: nowIso,
    expires_at: expiresAt,
    metadata: {
      provider: 'mercadopago',
      payment_id: paymentId,
      payment_status: payment?.status || null,
      amount: payment?.transaction_amount || null,
      currency: payment?.currency_id || null,
      approved_at: nowIso,
    },
  };
  const attempts = [
    basePayload,
    Object.fromEntries(Object.entries(basePayload).filter(([key]) => key !== 'metadata')),
    Object.fromEntries(Object.entries(basePayload).filter(([key]) => key !== 'active')),
    Object.fromEntries(Object.entries(basePayload).filter(([key]) => key !== 'active' && key !== 'metadata')),
  ];

  let lastError = null;
  for (const payload of attempts) {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (!error) return { data, expiresAt };
    lastError = error;
  }

  return { error: lastError };
}

async function logEvent(supabase, payload) {
  try {
    await supabase.from('payment_events').insert(payload);
  } catch (err) {
    console.log('payment_events insert falló:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabaseServer();

  try {
    const body = req.body || {};
    const type = body.type || req.query.type || null;
    const dataId = body?.data?.id || req.query['data.id'] || req.query.id || null;

    console.log('WEBHOOK MP BODY:', body);
    console.log('WEBHOOK MP QUERY:', req.query);

    if (!dataId) {
      await logEvent(supabase, {
        provider: 'mercadopago',
        event_type: 'webhook_without_data_id',
        status: 'ignored',
        payload_json: { body, query: req.query },
      });
      return res.status(200).json({ ok: true, ignored: true });
    }

    if (type !== 'payment') {
      await logEvent(supabase, {
        provider: 'mercadopago',
        event_type: String(type || 'unknown'),
        status: 'ignored',
        mercadopago_payment_id: String(dataId),
        payload_json: { body, query: req.query },
      });
      return res.status(200).json({ ok: true, ignored: true });
    }

    const payment = await mercadoPagoRequest(`/v1/payments/${dataId}`);

    const listingId =
      payment?.metadata?.listing_id ||
      getListingIdFromExternalReference(payment?.external_reference);

    const status = payment?.status || 'unknown';
    const paymentId = String(payment?.id || dataId);
    const subscription = getSubscriptionFromPayment(payment);

    await logEvent(supabase, {
      listing_id: listingId ? String(listingId) : null,
      provider: 'mercadopago',
      event_type: 'payment_webhook',
      status,
      mercadopago_payment_id: paymentId,
      payload_json: payment,
    });

    if (subscription) {
      if (status === 'approved') {
        const activated = await activateSubscription(supabase, {
          userId: subscription.userId,
          plan: subscription.plan,
          paymentId,
          payment,
        });
        if (activated.error) {
          console.log('ERROR UPDATE SUBSCRIPTION APPROVED:', activated.error);
          return res.status(500).json({ error: 'No se pudo activar suscripcion', detalle: activated.error });
        }
        return res.status(200).json({
          ok: true,
          status,
          subscription: subscription.plan,
          expiresAt: activated.expiresAt,
        });
      }

      return res.status(200).json({ ok: true, status, subscription: subscription.plan });
    }

    if (!listingId) {
      return res.status(200).json({ ok: true, warning: 'payment sin listing_id' });
    }

    if (status === 'approved') {
      const activated = await mirrorFeaturedState(supabase, String(listingId), 'activate', { planKey: 'PREMIUM', days: 30 });
      if (activated.error) {
        console.log('ERROR UPDATE LISTING APPROVED:', activated.error);
        return res.status(500).json({ error: 'No se pudo actualizar listing', detalle: activated.error });
      }
      await supabase.from('listings').update({ mercadopago_status: 'approved', mercadopago_payment_id: paymentId }).eq('id', String(listingId));
    } else {
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          mercadopago_status: status,
          mercadopago_payment_id: paymentId,
        })
        .eq('id', String(listingId));

      if (updateError) {
        console.log('ERROR UPDATE LISTING STATUS:', updateError);
      }
    }

    return res.status(200).json({ ok: true, status, listingId });
  } catch (err) {
    console.log('ERROR WEBHOOK MP:', err);

    await logEvent(supabase, {
      provider: 'mercadopago',
      event_type: 'webhook_error',
      status: 'error',
      payload_json: {
        message: err?.message || 'unknown',
        stack: err?.stack || null,
      },
    });

    return res.status(500).json({
      error: err.message || 'Webhook error',
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
