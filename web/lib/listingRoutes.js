export function getListingId(itemOrId) {
  if (!itemOrId) return '';
  if (typeof itemOrId === 'string' || typeof itemOrId === 'number') return String(itemOrId);
  return String(itemOrId.id || itemOrId.listing_id || itemOrId.public_id || '').trim();
}

export function getListingDetailHref(itemOrId) {
  const id = getListingId(itemOrId);
  return id ? `/ver-anuncio?id=${encodeURIComponent(id)}` : '#';
}

export function getListingEditHref(itemOrId) {
  const id = getListingId(itemOrId);
  return id ? `/editar?id=${encodeURIComponent(id)}` : '/mis-anuncios';
}
