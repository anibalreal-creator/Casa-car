import { getSupabaseServer } from '../../../lib/supabaseServer';
import { mirrorFeaturedState } from '../../../lib/featuredHelpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { listingId, premium = true, highlighted = true } = req.body || {};
    if (!listingId) return res.status(400).json({ error: 'Falta listingId' });
    const supabase = getSupabaseServer();
    if (!premium && !highlighted) {
      const expired = await mirrorFeaturedState(supabase, listingId, 'expire');
      if (expired.error) return res.status(500).json({ error: expired.error.message });
      return res.status(200).json({ ok: true, item: expired.data });
    }
    const activated = await mirrorFeaturedState(supabase, listingId, 'activate', { planKey: 'PREMIUM', days: 30 });
    if (activated.error) return res.status(500).json({ error: activated.error.message });
    return res.status(200).json({ ok: true, item: activated.data });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'No se pudo activar premium' });
  }
}
