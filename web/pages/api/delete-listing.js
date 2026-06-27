import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { methodNotAllowed } from '../../lib/server/apiSecurity';
import { requireUser } from '../../lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res, ['DELETE']);

  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const { id } = req.body || {};
    const listingId = String(id || '').trim();

    if (!listingId || !UUID_RE.test(listingId)) {
      return res.status(400).json({ error: 'id invalido' });
    }

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id,user_id')
      .eq('id', listingId)
      .single();

    if (!listing) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    if (listing.user_id !== user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', listingId);

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo eliminar el anuncio' });
  }
}
