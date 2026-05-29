const KEY = 'casacar_visitor_session';

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateVisitorSession() {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const created = randomId();
    window.localStorage.setItem(KEY, created);
    return created;
  } catch {
    return randomId();
  }
}
