const memory = new Map();

function now() {
  return Date.now();
}

export function clearClientFetchCache() {
  memory.clear();
}

export async function fetchJsonCached(url, options = {}) {
  const { ttlMs = 20000, fetchOptions = {} } = options;
  const shouldCache = Number(ttlMs) > 0;

  if (typeof window === 'undefined') {
    const response = await fetch(url, fetchOptions);
    return response.json();
  }

  const key = String(url);
  const cached = memory.get(key);
  const current = now();
  if (shouldCache && cached && current - cached.createdAt < ttlMs) {
    return cached.promise;
  }

  const promise = fetch(url, {
    ...fetchOptions,
    headers: {
      Accept: 'application/json',
      ...(fetchOptions.headers || {}),
    },
  })
    .then((response) => {
      if (!response.ok) throw new Error(`GET ${key} failed with ${response.status}`);
      return response.json();
    })
    .catch((error) => {
      memory.delete(key);
      throw error;
    });

  if (shouldCache) {
    memory.set(key, { createdAt: current, promise });
  }
  return promise;
}
