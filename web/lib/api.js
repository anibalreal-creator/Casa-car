export function ok(res, payload = {}, status = 200) {
  return res.status(status).json(payload);
}

export function fail(res, error, fallbackMessage = 'Error inesperado') {
  const statusCode = Number(error?.statusCode || error?.status || 500);
  const isServerError = statusCode >= 500;
  const exposeDetails = process.env.NODE_ENV !== 'production' && !isServerError;
  return res.status(statusCode).json({
    error: isServerError ? fallbackMessage : (error?.message || fallbackMessage),
    details: exposeDetails ? (error?.details || null) : null,
  });
}

export function methodNotAllowed(res) {
  return res.status(405).json({ error: 'Method not allowed' });
}

export function parsePagination(query = {}) {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(48, Math.max(1, Number(query.pageSize || 12)));
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
}

export function parseSort(sort = '') {
  switch (String(sort || '').toLowerCase()) {
    case 'price_asc':
      return { column: 'price', ascending: true };
    case 'price_desc':
      return { column: 'price', ascending: false };
    case 'views':
      return { column: 'views', ascending: false };
    case 'oldest':
      return { column: 'created_at', ascending: true };
    default:
      return { column: 'created_at', ascending: false };
  }
}
