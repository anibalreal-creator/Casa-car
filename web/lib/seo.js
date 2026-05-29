import { categoryLabel } from './category';
import { getListingImages, getListingPrimaryImage } from './listingImages';
import { buildListingSlug, slugify } from './slugify';
import { getSiteUrl } from './siteUrl';
import { getAmenityLabels, getTourismSpecs, isTourismListing } from './tourism';

export function trimText(value = '', max = 160) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trim()}...`;
}

export function absoluteUrl(value = '') {
  const site = getSiteUrl().replace(/\/+$/, '');
  const raw = String(value || '').trim();
  if (!raw) return `${site}/casa-car-logo.png`;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${site}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

export function xmlEscape(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSeo({
  title = 'Casa-Car',
  description = 'Marketplace global de propiedades, vehiculos, nautica, turismo, maquinaria y servicios.',
  image = '/casa-car-logo.png',
  url = '/',
} = {}) {
  return {
    title,
    description: trimText(description, 165),
    image: absoluteUrl(image),
    url: absoluteUrl(url),
  };
}

export function normalizeListingForSeo(item = {}) {
  if (!item) return null;
  return {
    ...item,
    images: getListingImages(item),
  };
}

export function getListingSeoSlug(item = {}) {
  return item.seo_slug || item.slug || buildListingSlug(item);
}

export function getListingSeoPath(item = {}) {
  const category = slugify(categoryLabel(item.category || 'general')) || 'anuncios';
  const slug = slugify(getListingSeoSlug(item)) || String(item.id || 'anuncio');
  return `/seo/${category}/${slug}`;
}

export function getListingCanonicalUrl(item = {}) {
  if (!item?.id) return absoluteUrl('/');
  return absoluteUrl(getListingSeoPath(item));
}

export function buildListingDescription(item = {}) {
  const bits = [
    item.title,
    item.subtype,
    item.category ? categoryLabel(item.category) : '',
    item.city,
    item.state,
    item.country,
  ].filter(Boolean);
  const fallback = `${bits.join(' en ')}. Publicacion en Casa-Car con contacto directo, favoritos y ficha tecnica.`;
  return trimText(item.description || fallback, 165);
}

export function buildListingJsonLd(item = {}) {
  const canonical = getListingCanonicalUrl(item);
  const images = getListingImages(item).map(absoluteUrl);
  const price = Number(item.price || 0);
  const specs = item.specs_json && typeof item.specs_json === 'object' ? item.specs_json : {};
  const tourism = isTourismListing(item);

  if (tourism) {
    const tourismSpecs = getTourismSpecs(item);
    const type = tourismSpecs.tourism_type === 'experience' ? 'TouristAttraction' : 'LodgingBusiness';
    return {
      '@context': 'https://schema.org',
      '@type': type,
      name: item.title || 'Turismo Casa-Car',
      description: buildListingDescription(item),
      image: images,
      url: canonical,
      address: [item.address, item.city, item.state, item.country].filter(Boolean).join(', ') || undefined,
      geo: item.lat && item.lng ? {
        '@type': 'GeoCoordinates',
        latitude: Number(item.lat),
        longitude: Number(item.lng),
      } : undefined,
      amenityFeature: getAmenityLabels(item, 'es').map((name) => ({
        '@type': 'LocationFeatureSpecification',
        name,
        value: true,
      })),
      makesOffer: {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: item.currency || 'USD',
        price: price > 0 ? price : Number(tourismSpecs.base_price_night || 0) || undefined,
        availability: 'https://schema.org/InStock',
      },
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.title || 'Anuncio Casa-Car',
    description: buildListingDescription(item),
    image: images,
    url: canonical,
    category: item.category || categoryLabel(item.category || ''),
    brand: specs.brand || item.brand || undefined,
    model: specs.model || item.model || undefined,
    sku: String(item.id || ''),
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: item.currency || 'USD',
      price: price > 0 ? price : undefined,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
    },
  };
}

export function buildBreadcrumbJsonLd(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? absoluteUrl(item.href) : undefined,
    })),
  };
}

export function buildItemListJsonLd(items = [], pageUrl = '/') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: absoluteUrl(pageUrl),
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: getListingCanonicalUrl(item),
      name: item.title || categoryLabel(item.category || 'Anuncio'),
      image: absoluteUrl(getListingPrimaryImage(item)),
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Casa-Car',
    url: absoluteUrl('/'),
    logo: absoluteUrl('/casa-car-logo.png'),
    sameAs: [],
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Casa-Car',
    url: absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/buscar')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
