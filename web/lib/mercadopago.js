import { getSiteUrl } from './siteUrl';

const MP_BASE_URL = 'https://api.mercadopago.com';

function getMpToken() {
  const token =
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    process.env.MP_ACCESS_TOKEN ||
    '';

  if (!token) {
    throw new Error('Falta configurar MERCADOPAGO_ACCESS_TOKEN en Vercel y/o .env.local');
  }

  return token;
}

export async function mercadoPagoRequest(path, { method = 'GET', body } = {}) {
  const token = getMpToken();

  const response = await fetch(`${MP_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.cause?.[0]?.description ||
      `MercadoPago ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export function buildPremiumPreference({ listing, user }) {
  const listingId = String(listing.id);
  const title = listing?.title || 'Anuncio';

  // IMPORTANTE: para evitar el error de MercadoPago
  // "auto_return invalid. back_url.success must be defined"
  // usamos URLs públicas, fijas y sin query params.
  const baseUrl = getSiteUrl();
  const returnUrl = `${baseUrl}/mis-anuncios`;

  return {
    items: [
      {
        id: listingId,
        title: `Casa-Car Premium - ${title}`,
        description: `Activación premium para el anuncio ${title}`,
        category_id: 'services',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: 100,
      },
    ],
    metadata: {
      source: 'casa-car',
      feature: 'premium_listing',
      listing_id: listingId,
      listing_title: title,
      user_id: user?.id || listing?.user_id || null,
      premium_plan: 'Premium 30 días',
    },
    back_urls: {
      success: returnUrl,
      failure: returnUrl,
      pending: returnUrl,
    },
    auto_return: 'approved',
    external_reference: `listing:${listingId}`,
    notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
    statement_descriptor: 'CASA-CAR',
  };
}
