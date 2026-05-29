import { getSupabaseServer } from '../../../lib/supabaseServer';
import { checkRateLimit } from '../../../lib/server/rateLimit';

const ALLOWED = new Set(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB', 'Next.js-hydration', 'Next.js-route-change-to-render', 'Next.js-render']);

function cleanText(value = '', max = 500) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRateLimit(req, res, { name: 'web-vitals', limit: 180, windowMs: 60_000 })) return;

  const name = cleanText(req.body?.name, 80);
  if (!ALLOWED.has(name)) return res.status(202).json({ ok: true, ignored: true });

  const payload = {
    metric_id: cleanText(req.body?.id, 120),
    name,
    label: cleanText(req.body?.label, 80),
    value: Number(req.body?.value || 0),
    delta: Number(req.body?.delta || 0),
    rating: cleanText(req.body?.rating, 30),
    path: cleanText(req.body?.path || '/', 220),
    href: cleanText(req.body?.href || '', 500),
    user_agent: cleanText(req.body?.userAgent || req.headers['user-agent'] || '', 500),
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = getSupabaseServer();
    await supabase.from('web_vitals').insert(payload);
  } catch {
    // The metric endpoint must never break the user experience if the optional table is not installed yet.
  }

  return res.status(202).json({ ok: true });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '64kb',
    },
  },
};
