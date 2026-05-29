import { getSupabaseServer } from '../../lib/supabaseServer';
import { getServerUser } from '../../lib/auth';

function cut(value, max) {
  return String(value || '').slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const serverUser = await getServerUser(req);
    const body = req.body || {};
    const sessionKey = cut(body.session_key || req.headers['x-session-key'] || 'anon', 120);
    const userId = serverUser?.id || body.user_id || null;
    const userEmail = serverUser?.email || body.user_email || null;
    const path = cut(body.path || '/', 200);
    const supabase = getSupabaseServer();
    const payload = {
      session_key: sessionKey,
      user_id: userId,
      user_email: userEmail,
      is_authenticated: !!userId,
      path,
      current_path: path,
      referrer: cut(body.referrer || '', 300),
      user_agent: cut(req.headers['user-agent'] || '', 300),
      last_seen_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('presence_heartbeats').upsert(payload, { onConflict: 'session_key' });
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(200).json({ ok: false, ignored: true, message: error.message || 'heartbeat skipped' });
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
