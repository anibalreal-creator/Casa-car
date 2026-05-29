import { getSupabaseServer } from '../../../lib/supabaseServer';
import { normalizeAdRecord } from '../../../lib/adHelpers';
import { allowMethods, requireInternalRequest, safeJson } from '../../../lib/server/internalApi';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireInternalRequest(req, res)) return;
  try {
    const supabase = getSupabaseServer();
    const { user_id = '', contact_email = '' } = req.body || {};
    let query = supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false }).limit(50);
    if (user_id) query = query.eq('user_id', String(user_id));
    if (contact_email) query = query.eq('contact_email', String(contact_email));
    const { data, error } = await query;
    if (error) throw error;
    return safeJson(res, 200, { campaigns: (data || []).map(normalizeAdRecord) });
  } catch (error) {
    return safeJson(res, 500, { error: error.message, campaigns: [] });
  }
}
