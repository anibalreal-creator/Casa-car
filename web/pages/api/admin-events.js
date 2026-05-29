import { getSupabaseServer } from '../../lib/supabaseServer';
import { allowMethods, requireInternalRequest, safeJson } from '../../lib/server/internalApi';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireInternalRequest(req, res)) return;

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('listing_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return safeJson(res, 200, Array.isArray(data) ? data : []);
  } catch (error) {
    return safeJson(res, 500, { error: error.message || 'No se pudieron cargar eventos admin' });
  }
}
