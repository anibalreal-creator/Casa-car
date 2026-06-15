import { getSupabaseServer } from '../../lib/supabaseServer';
import { ok, fail, methodNotAllowed } from '../../lib/api';
import { checkRateLimit } from '../../lib/server/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  if (!checkRateLimit(req, res, { name: 'analytics-track', limit: 180, windowMs: 60_000 })) return;
  try {
    const supabase = getSupabaseServer();
    const payload = {
      event_name: String(req.body?.event_name || 'unknown').slice(0, 80),
      entity_type: String(req.body?.entity_type || '').slice(0, 80),
      entity_id: String(req.body?.entity_id || '').slice(0, 120),
      meta: req.body?.meta || {},
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('analytics_events').insert(payload);
    if (error) throw error;
    return ok(res, { ok: true }, 201);
  } catch (error) {
    return fail(res, error, 'No se pudo registrar el evento');
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
