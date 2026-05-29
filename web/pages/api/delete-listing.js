import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { methodNotAllowed } from '../../lib/server/apiSecurity';
import { requireUser } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res, ['DELETE']);

  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: 'Falta id' });
    }

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', id)
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
      .eq('id', id);

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
