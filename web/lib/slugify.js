export function slugify(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildListingSlug(item = {}) {
  const category = slugify(item.category || 'anuncio');
  const city = slugify(item.city || 'global');
  const title = slugify(item.title || item.subtype || 'listing');
  return [category, title, city].filter(Boolean).slice(0, 3).join('-');
}
