import { getSupabaseServer } from '../../lib/supabaseServer';
import { allowMethods, requireInternalRequest, safeJson } from '../../lib/server/internalApi';
import { requireAdminRoute } from '../../lib/apiRouteGuards';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireInternalRequest(req, res)) return;
  const admin = await requireAdminRoute(req, res, { allowLocalDev: false });
  if (!admin) return;

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('listing_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return safeJson(res, 200, Array.isArray(data) ? data : []);
  } catch {
    return safeJson(res, 500, { error: 'No se pudieron cargar eventos admin' });
  }
}
