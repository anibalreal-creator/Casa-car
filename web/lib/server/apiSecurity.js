import { requireUser } from '../auth';
import { isAdmin } from '../permissions';

function getHeader(req, name) {
  return req?.headers?.[name] || req?.headers?.[name?.toLowerCase?.()] || req?.headers?.[name?.toUpperCase?.()] || '';
}

export function methodNotAllowed(res, allowed = ['POST']) {
  res.setHeader('Allow', allowed);
  return res.status(405).json({ error: 'Method not allowed' });
}

export function allowMethods(req, res, allowed = ['POST']) {
  if (!allowed.includes(req?.method || '')) {
    methodNotAllowed(res, allowed);
    return false;
  }
  return true;
}

export function notFoundJson(res) {
  return res.status(404).json({ error: 'Not found' });
}

export function safeJson(res, status = 200, payload = {}) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(payload);
}

export function requireJsonBody(req, res) {
  const contentType = String(getHeader(req, 'content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    res.status(415).json({ error: 'Content-Type debe ser application/json' });
    return false;
  }
  return true;
}

export function requireAdminKey(req, res) {
  const expected =
    process.env.ADMIN_API_KEY ||
    process.env.INTERNAL_ADMIN_KEY ||
    process.env.ROUTE_ADMIN_KEY ||
    '';

  if (!expected) {
    res.status(503).json({ error: 'Admin key no configurada' });
    return false;
  }

  const provided =
    String(getHeader(req, 'x-admin-key') || '').trim() ||
    String(req?.query?.admin_key || '').trim() ||
    String(req?.body?.admin_key || '').trim();

  if (!provided || provided !== expected) {
    res.status(401).json({ error: 'No autorizado' });
    return false;
  }

  return true;
}

export async function requireAdminUser(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const allowed = await isAdmin(user.id, user.email);
  if (!allowed) {
    res.status(403).json({ error: 'Solo admin' });
    return null;
  }
  return user;
}
