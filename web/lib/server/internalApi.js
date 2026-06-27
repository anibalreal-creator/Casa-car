
export function withNoStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res;
}

export function safeJson(res, status, payload) {
  withNoStore(res);
  return res.status(status).json(payload);
}

export function allowMethods(req, res, methods = []) {
  const allowed = methods.map((m) => String(m || '').toUpperCase());
  if (allowed.includes(String(req.method || '').toUpperCase())) return true;
  res.setHeader('Allow', allowed.join(', '));
  safeJson(res, 405, { error: 'Method not allowed' });
  return false;
}

export function requireInternalRequest(req, res) {
  const internal = String(req.headers['x-casa-request'] || '') === '1';
  if (internal) return true;
  safeJson(res, 404, { error: 'Not found' });
  return false;
}

export function requireAdminDebugKey(req, res) {
  const expected = process.env.ADMIN_DASHBOARD_KEY || process.env.CASA_CAR_ADMIN_KEY || '';
  if (!expected) {
    safeJson(res, 404, { error: 'Not found' });
    return false;
  }
  const received = String(req.headers['x-admin-key'] || req.query?.admin_key || req.body?.admin_key || '');
  if (received && received === expected) return true;
  safeJson(res, 401, { error: 'No autorizado' });
  return false;
}
