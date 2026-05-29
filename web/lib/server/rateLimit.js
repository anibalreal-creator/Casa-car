const buckets = new Map();

function getIp(req) {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req?.socket?.remoteAddress || 'unknown';
}

export function checkRateLimit(req, res, options = {}) {
  const {
    name = 'default',
    limit = 60,
    windowMs = 60_000,
  } = options;
  const key = `${name}:${getIp(req)}`;
  const current = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || current > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: current + windowMs });
    return true;
  }

  bucket.count += 1;
  if (bucket.count <= limit) return true;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - current) / 1000));
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({ error: 'Demasiadas solicitudes. Probá nuevamente en unos segundos.' });
  return false;
}
