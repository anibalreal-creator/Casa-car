
export function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function sameText(a = "", b = "") {
  return normalizeText(a) === normalizeText(b);
}

export function uniqueNormalized(values = []) {
  const seen = new Map();
  values.filter(Boolean).forEach((v) => {
    const key = normalizeText(v);
    if (!seen.has(key)) seen.set(key, String(v).trim());
  });
  return [...seen.values()].sort((x, y) => x.localeCompare(y));
}
