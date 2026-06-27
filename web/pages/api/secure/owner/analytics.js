import { requireUser } from '../../../../lib/auth';
import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { isOwnerEmail } from '../../../../lib/owner';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo no permitido' });
  const user = await requireUser(req, res);
  if (!user) return;
  if (!isOwnerEmail(user.email)) return res.status(403).json({ error: 'Solo el dueno puede ver estas metricas' });

  try {
    const supabase = getSupabaseServer();
    const now = new Date();
    const onlineFrom = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);

    const [onlineRes, dailyRes] = await Promise.all([
      supabase.from('presence_heartbeats').select('session_key,user_id,is_authenticated,last_seen_at').gte('last_seen_at', onlineFrom),
      supabase.from('presence_heartbeats').select('session_key,user_id,is_authenticated,last_seen_at').gte('last_seen_at', dayStart.toISOString()),
    ]);

    const onlineRows = onlineRes.data || [];
    const dailyRows = dailyRes.data || [];
    const unique = (rows, mapper) => Array.from(new Set(rows.map(mapper).filter(Boolean)));

    const stats = {
      online_now: unique(onlineRows, (row) => row.user_id || row.session_key).length,
      authenticated_online_now: unique(onlineRows.filter((row) => row.is_authenticated), (row) => row.user_id || row.session_key).length,
      unique_visitors_today: unique(dailyRows, (row) => row.session_key).length,
      unique_users_today: unique(dailyRows.filter((row) => row.user_id), (row) => row.user_id).length,
      heartbeat_window_minutes: 5,
    };

    return res.status(200).json({
      ok: true,
      checkedAt: now.toISOString(),
      stats,
      onlineNow: stats.online_now,
      onlineAuthenticatedNow: stats.authenticated_online_now,
      dailyUniqueVisitors: stats.unique_visitors_today,
      dailyUniqueUsers: stats.unique_users_today,
    });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudieron cargar metricas en vivo' });
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
