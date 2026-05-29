import { supabaseBrowser } from './supabaseBrowser';
import { isOwnerEmail } from './owner';

export async function startPremiumCheckout(listingId) {
  const { data } = await supabaseBrowser.auth.getSession();
  const session = data?.session || null;
  const isOwner = isOwnerEmail(session?.user?.email);

  if (isOwner) {
    const res = await fetch('/api/secure/premium-flow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ listing_id: listingId, step: 'activate', plan: 'OWNER_FREE' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'No se pudo activar el modo dueño');
    if (typeof window !== 'undefined') {
      window.alert('Premium activado gratis para la cuenta dueña.');
      window.location.reload();
    }
    return data;
  }

  const res = await fetch('/api/payments/mercadopago/create-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId }),
  });

  const responseData = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = responseData?.error || responseData?.detail || 'Error al iniciar pago';
    throw new Error(message);
  }

  const checkoutUrl =
    responseData?.checkout_url ||
    responseData?.chosen_checkout_url ||
    responseData?.init_point ||
    responseData?.sandbox_init_point ||
    null;

  if (!checkoutUrl) {
    throw new Error('Mercado Pago no devolvió URL de pago');
  }

  if (typeof window !== 'undefined') {
    window.location.href = checkoutUrl;
  }

  return { checkoutUrl, data: responseData };
}
