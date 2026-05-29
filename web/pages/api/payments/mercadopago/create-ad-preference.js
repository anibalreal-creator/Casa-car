import { buildAdPreference } from '../../../../lib/adHelpers';

function getBaseUrl(req) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '';
  if (envUrl) return envUrl.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  try {
    const { campaignId, title, planKey, slotKey, companyName } = req.body || {};

    if (!campaignId) {
      return res.status(400).json({ error: 'Falta campaignId' });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN' });
    }

    const preference = buildAdPreference({
      campaign: {
        id: campaignId,
        title,
        plan_key: planKey,
        slot_key: slotKey,
        company_name: companyName,
      },
      baseUrl: getBaseUrl(req),
    });

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message || data?.error || 'No se pudo crear la preferencia' });
    }

    return res.status(200).json({
      checkout_url: data.init_point,
      chosen_checkout_url: data.init_point,
      sandbox_url: data.sandbox_init_point || null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error creando preferencia publicitaria' });
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
