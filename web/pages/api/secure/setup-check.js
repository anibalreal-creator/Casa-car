import { createClient } from '@supabase/supabase-js';
import { allowMethods, requireAdminDebugKey, safeJson } from '../../../lib/server/internalApi';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireAdminDebugKey(req, res)) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tablesToCheck = [
    'profiles',
    'listings',
    'favorites',
    'ad_campaigns',
    'payment_events',
    'subscriptions',
    'presence_heartbeats',
  ];

  const results = {};

  for (const table of tablesToCheck) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      results[table] = error
        ? { ok: false, error: error.message }
        : { ok: true, count: count ?? 0 };
    } catch (e) {
      results[table] = { ok: false, error: e.message };
    }
  }

  const ok = Object.values(results).every((r) => r.ok);

  return safeJson(res, 200, {
    ok,
    checkedAt: new Date().toISOString(),
    tables: results,
  });
}
