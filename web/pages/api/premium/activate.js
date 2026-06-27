import { getSupabaseServer } from '../../../lib/supabaseServer';
import { mirrorFeaturedState } from '../../../lib/featuredHelpers';
import { requireAuthenticatedRoute } from '../../../lib/apiRouteGuards';
import { isOwnerEmail } from '../../../lib/owner';
import { enforcePremiumActivationLimit } from '../../../lib/listingLimits';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const { listingId, premium = true, highlighted = true } = req.body || {};
    if (!listingId) return res.status(400).json({ error: 'Falta listingId' });
    const supabase = getSupabaseServer();

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id,user_id')
      .eq('id', String(listingId))
      .maybeSingle();
    if (listingError) throw listingError;
    if (!listing) return res.status(404).json({ error: 'Anuncio no encontrado' });
    if (String(listing.user_id || '') !== String(user.id) && !isOwnerEmail(user.email || '')) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (!premium && !highlighted) {
      const expired = await mirrorFeaturedState(supabase, listingId, 'expire');
      if (expired.error) return res.status(500).json({ error: 'No se pudo actualizar premium' });
      return res.status(200).json({ ok: true, item: expired.data });
    }

    const premiumQuota = await enforcePremiumActivationLimit(supabase, user, { excludeListingId: listingId });
    if (!premiumQuota.canActivatePremium) {
      return res.status(402).json(premiumQuota.blockedResponse);
    }

    const activated = await mirrorFeaturedState(supabase, listingId, 'activate', { planKey: 'PREMIUM', days: 30 });
    if (activated.error) return res.status(500).json({ error: 'No se pudo activar premium' });
    return res.status(200).json({ ok: true, item: activated.data });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo activar premium' });
  }
}
