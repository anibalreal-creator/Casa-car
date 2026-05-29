function safeJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeImageEntry(entry) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object') {
    return (
      entry.url ||
      entry.src ||
      entry.path ||
      entry.secure_url ||
      entry.publicUrl ||
      entry.image_url ||
      entry.imageUrl ||
      ''
    );
  }
  return '';
}

export function getListingImages(item) {
  const direct = [
    item?.image_url,
    item?.imageUrl,
    item?.image,
    item?.cover_image,
    item?.coverImage,
    item?.cover,
    item?.main_image,
    item?.mainImage,
    item?.thumbnail,
    item?.thumbnail_url,
    item?.photo_url,
    item?.photo,
    item?.banner,
    item?.hero_image,
  ].filter(Boolean);

  const arrays = [
    safeJsonArray(item?.images),
    safeJsonArray(item?.photos),
    safeJsonArray(item?.gallery),
    safeJsonArray(item?.media),
    safeJsonArray(item?.files),
  ];

  const normalizedArrays = arrays.flatMap((arr) =>
    Array.isArray(arr) ? arr.map(normalizeImageEntry).filter(Boolean) : []
  );

  const all = [...direct, ...normalizedArrays].filter(Boolean);
  return all.length ? all : ['/placeholder-property.jpg'];
}

export function getListingPrimaryImage(item) {
  const images = getListingImages(item);
  const index = Number(item?.main_image_index || 0);
  return images[index] || images[0] || '/placeholder-property.jpg';
}
