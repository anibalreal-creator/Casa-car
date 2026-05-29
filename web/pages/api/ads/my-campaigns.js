import { getSupabaseServer } from '../../../lib/supabaseServer';
import { normalizeAdRecord } from '../../../lib/adHelpers';
import { allowMethods, requireInternalRequest, safeJson } from '../../../lib/server/internalApi';
import { requireAuthenticatedRoute } from '../../../lib/apiRouteGuards';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireInternalRequest(req, res)) return;
  try {
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const supabase = getSupabaseServer();
    const byUser = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('user_id', String(user.id))
      .order('created_at', { ascending: false })
      .limit(50);

    if (byUser.error) throw byUser.error;

    let rows = Array.isArray(byUser.data) ? byUser.data : [];
    if (user.email) {
      const byEmail = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('contact_email', String(user.email))
        .order('created_at', { ascending: false })
        .limit(50);

      if (!byEmail.error && Array.isArray(byEmail.data)) {
        const seen = new Set(rows.map((item) => String(item.id)));
        rows = rows.concat(byEmail.data.filter((item) => !item.user_id && !seen.has(String(item.id))));
      }
    }

    rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return safeJson(res, 200, { campaigns: rows.slice(0, 50).map(normalizeAdRecord) });
  } catch (error) {
    return safeJson(res, 500, { error: error.message, campaigns: [] });
  }
}
