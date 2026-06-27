import { getSupabaseServer } from '../../../lib/supabaseServer';
import { getServerUser } from '../../../lib/auth';
import { isOwnerEmail } from '../../../lib/owner';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const user = await getServerUser(req);
  if (!user || !isOwnerEmail(user.email)) {
    return res.status(403).json({ error: 'Solo disponible para la cuenta dueña' });
  }

  const supabase = getSupabaseServer();

  try {
    const [profiles, subscriptions, listings, campaigns, favorites, payments] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }),
      supabase.from('favorites').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('id', { count: 'exact', head: true }),
    ]);

    return res.status(200).json({
      ok: true,
      counts: {
        profiles: profiles.count || 0,
        subscriptions: subscriptions.count || 0,
        listings: listings.count || 0,
        campaigns: campaigns.count || 0,
        favorites: favorites.count || 0,
        payments: payments.count || 0,
      },
      owner: user.email,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'No se pudo validar el estado SaaS' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
