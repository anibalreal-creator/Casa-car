import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import GlobalHeader from '../components/GlobalHeader';
import SearchSidebar from '../components/SearchSidebar';
import ListingCard from '../components/ListingCard';
import FooterBlueBar from '../components/FooterBlueBar';
import AdSlot from '../components/AdSlot';
import EmptyState from '../components/EmptyState';
import SkeletonCard from '../components/SkeletonCard';
import Breadcrumbs from '../components/Breadcrumbs';
import SeoHead from '../components/SeoHead';
import SeoJsonLd from '../components/SeoJsonLd';
import TourismSearchMap from '../components/TourismSearchMap';
import { matchesCountry, normalizeText } from '../lib/locationHelpers';
import { itemMatchesCategory, normalizeCategory, categoryLabel } from '../lib/category';
import { useLang } from '../context/LanguageContext';
import { secureFetch } from '../lib/secureClient';
import { buildItemListJsonLd, buildOrganizationJsonLd } from '../lib/seo';
import { fetchJsonCached } from '../lib/clientFetchCache';
import { calculateNights, getTourismSpecs, hasBlockedDates, isTourismListing } from '../lib/tourism';

const defaults = {
  q: '', category: '', country: '', state: '', city: '', type: '', min: '', max: '', sort: 'recent',
  propertySubtype: '', rooms: '', bathrooms: '', surface: '', constructionStatus: '', advertiserType: '', commissionShare: '',
  brand: '', model: '', year: '', fuel: '', kmMax: '', lengthMin: '', beamMin: '', cabins: '', engine: '',
  balcony: false, patio: false, pool: false, garage: false, furnished: false, terrace: false, sum: false,
  security24h: false, petFriendly: false, professionalUse: false,
  tourismType: '', checkIn: '', checkOut: '', guests: '', instantBook: false, wifi: false, breakfast: false,
  parking: false, spa: false, gym: false, beachfront: false
};

function truthyQuery(value) {
  return value === '1' || value === 'true' || value === true;
}
function normalizeBasic(value = '') { return normalizeText(value); }
function getSpecs(item) { return item?.specs_json && typeof item.specs_json === 'object' ? item.specs_json : {}; }
function getValue(item, ...keys) {
  const specs = getSpecs(item);
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== '') return item[key];
    if (specs?.[key] !== undefined && specs?.[key] !== null && specs?.[key] !== '') return specs[key];
  }
  return '';
}
function toNumber(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function isTruthy(value) { return value === true || value === 'true' || value === 1 || value === '1' || value === 'Si' || value === 'Sí'; }

function filterChipLabel(key, t) {
  const labels = {
    q: t('filter_what', 'Qué buscás'),
    category: t('search_category', 'Categoría'),
    country: t('search_country', 'País'),
    state: t('search_state', 'Provincia'),
    city: t('search_city', 'Ciudad'),
    type: t('search_operation', 'Operación'),
    min: t('filter_min_price', 'Precio min.'),
    max: t('filter_max_price', 'Precio máx.'),
    propertySubtype: t('filter_property_subtype', 'Subtipo de propiedad'),
    rooms: t('filter_bedrooms', 'Dormitorios'),
    bathrooms: t('property_bathrooms', 'Baños'),
    surface: t('filter_min_surface', 'm² mínimos'),
    constructionStatus: t('property_construction_status', 'Estado de obra'),
    advertiserType: t('property_advertiser_type', 'Tipo de anunciante'),
    commissionShare: t('property_commission', 'Comparte comisión'),
    brand: t('brand_label', 'Marca'),
    model: t('model_label', 'Modelo'),
    year: t('year_from', 'Año desde'),
    fuel: t('filter_fuel', 'Combustible'),
    kmMax: t('filter_max_km', 'Km max.'),
    lengthMin: t('filter_length_min', 'Eslora min.'),
    beamMin: t('filter_beam_min', 'Manga min.'),
    cabins: t('filter_cabins_min', 'Cabinas min.'),
    engine: t('filter_engine', 'Motor'),
    tourismType: t('tourism_type', 'Tipo turistico'),
    checkIn: t('checkin', 'Check-in'),
    checkOut: t('checkout', 'Check-out'),
    guests: t('guests', 'Huespedes'),
    instantBook: t('instant_book', 'Reserva inmediata'),
    wifi: 'Wifi',
    breakfast: t('breakfast', 'Desayuno'),
    parking: t('parking', 'Estacionamiento'),
    spa: 'Spa',
    gym: t('gym', 'Gimnasio'),
    beachfront: t('beachfront', 'Frente al mar'),
  };
  return labels[key] || key;
}

function filtersFromQuery(query = {}) {
  return {
    q: String(query.q || ''),
    category: normalizeCategory(String(query.category || '')),
    country: String(query.country || ''),
    state: String(query.state || ''),
    city: String(query.city || ''),
    type: String(query.type || ''),
    min: String(query.min || ''),
    max: String(query.max || ''),
    sort: String(query.sort || 'recent'),
    propertySubtype: String(query.propertySubtype || ''),
    rooms: String(query.rooms || ''),
    bathrooms: String(query.bathrooms || ''),
    surface: String(query.surface || ''),
    constructionStatus: String(query.constructionStatus || ''),
    advertiserType: String(query.advertiserType || ''),
    commissionShare: String(query.commissionShare || ''),
    brand: String(query.brand || ''),
    model: String(query.model || ''),
    year: String(query.year || ''),
    fuel: String(query.fuel || ''),
    kmMax: String(query.kmMax || ''),
    lengthMin: String(query.lengthMin || ''),
    beamMin: String(query.beamMin || ''),
    cabins: String(query.cabins || ''),
    engine: String(query.engine || ''),
    tourismType: String(query.tourismType || ''),
    checkIn: String(query.checkIn || ''),
    checkOut: String(query.checkOut || ''),
    guests: String(query.guests || ''),
    balcony: truthyQuery(query.balcony),
    patio: truthyQuery(query.patio),
    pool: truthyQuery(query.pool),
    garage: truthyQuery(query.garage),
    furnished: truthyQuery(query.furnished),
    terrace: truthyQuery(query.terrace),
    sum: truthyQuery(query.sum),
    security24h: truthyQuery(query.security24h),
    petFriendly: truthyQuery(query.petFriendly),
    professionalUse: truthyQuery(query.professionalUse),
    instantBook: truthyQuery(query.instantBook),
    wifi: truthyQuery(query.wifi),
    breakfast: truthyQuery(query.breakfast),
    parking: truthyQuery(query.parking),
    spa: truthyQuery(query.spa),
    gym: truthyQuery(query.gym),
    beachfront: truthyQuery(query.beachfront),
  };
}

function pageFromQuery(query = {}) {
  return Math.max(1, Number(query.page || 1));
}

export async function getServerSideProps({ query, res }) {
  res?.setHeader?.('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return { props: { initialQuery: query || {} } };
}

export default function Buscar({ initialQuery = {} }) {
  const { t } = useLang();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(() => filtersFromQuery(initialQuery));
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(() => pageFromQuery(initialQuery));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [savingSearch, setSavingSearch] = useState(false);
  const [saveSearchMessage, setSaveSearchMessage] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    setFilters(filtersFromQuery(router.query));
    setPage(pageFromQuery(router.query));
  }, [router.isReady, router.query]);

  useEffect(() => {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('pageSize', '12');
    if (filters.sort && filters.sort !== 'recent') query.set('sort', filters.sort);
    if (filters.category) query.set('category', normalizeCategory(filters.category));
    if (filters.q) query.set('q', filters.q);
    if (filters.country) query.set('country', filters.country);
    if (filters.state) query.set('state', filters.state);
    if (filters.city) query.set('city', filters.city);
    if (filters.type) query.set('type', filters.type);
    query.set('_ts', String(Date.now()));

    setLoading(true);
    fetchJsonCached(`/api/listings?${query.toString()}`, { ttlMs: 0, fetchOptions: { cache: 'no-store' } })
      .then((payload) => {
        const rows = Array.isArray(payload) ? payload : payload?.items || [];
        setItems(rows);
        setTotal(Number(payload?.total || rows.length || 0));
        setTotalPages(Number(payload?.totalPages || 1));
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [filters.sort, filters.category, filters.q, filters.country, filters.state, filters.city, filters.type, page]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const hay = normalizeText([
        item?.title, item?.city, item?.state, item?.country, item?.zone, item?.address,
        item?.category, item?.subtype, item?.description, getValue(item, 'brand'), getValue(item, 'model'),
      ].filter(Boolean).join(' '));
      const q = normalizeText(filters.q || '');
      if (q && !hay.includes(q)) return false;
      if (filters.category && !itemMatchesCategory(item, filters.category)) return false;
      if (filters.country && !matchesCountry(item.country || '', filters.country)) return false;
      if (filters.state && normalizeBasic(item.state || '') !== normalizeBasic(filters.state)) return false;
      if (filters.city && normalizeBasic(item.city || '') !== normalizeBasic(filters.city)) return false;
      if (filters.type && normalizeBasic(item.listing_type || 'venta') !== normalizeBasic(filters.type)) return false;
      const price = toNumber(item.price || item.priceUsd || item.priceARS || 0);
      if (filters.min && price < toNumber(filters.min)) return false;
      if (filters.max && price > toNumber(filters.max)) return false;
      const isPropertyContext = !filters.category || filters.category === 'Propiedad';
      const isTourismContext = filters.category === 'Turismo' || isTourismListing(item);
      if (isPropertyContext) {
        if (filters.propertySubtype && normalizeBasic(item.subtype || '') !== normalizeBasic(filters.propertySubtype)) return false;
        if (filters.rooms && toNumber(item.rooms || getValue(item, 'rooms')) < toNumber(filters.rooms)) return false;
        if (filters.bathrooms && toNumber(item.bathrooms || getValue(item, 'bathrooms')) < toNumber(filters.bathrooms)) return false;
        if (filters.surface && toNumber(item.surface || getValue(item, 'surface', 'covered_surface', 'total_surface')) < toNumber(filters.surface)) return false;
        if (filters.constructionStatus && normalizeBasic(getValue(item, 'construction_status')) !== normalizeBasic(filters.constructionStatus)) return false;
        if (filters.advertiserType && normalizeBasic(getValue(item, 'advertiser_type')) !== normalizeBasic(filters.advertiserType)) return false;
        if (filters.commissionShare && normalizeBasic(getValue(item, 'commission_share')) !== normalizeBasic(filters.commissionShare)) return false;
        if (filters.balcony && !(item.balcony || isTruthy(getValue(item, 'balcony')))) return false;
        if (filters.patio && !(item.patio || isTruthy(getValue(item, 'patio')))) return false;
        if (filters.pool && !(item.pool || isTruthy(getValue(item, 'pool')))) return false;
        if (filters.garage && !(item.garage || isTruthy(getValue(item, 'garage')) || toNumber(item.garages_count || getValue(item, 'garages_count')) > 0)) return false;
        if (filters.furnished && !(item.furnished || isTruthy(getValue(item, 'furnished')))) return false;
        if (filters.terrace && !(item.terrace || isTruthy(getValue(item, 'terrace')))) return false;
        if (filters.sum && !(item.sum || isTruthy(getValue(item, 'sum')))) return false;
        if (filters.security24h && !(item.security24h || isTruthy(getValue(item, 'security24h')))) return false;
        if (filters.petFriendly && !(item.pet_friendly || isTruthy(getValue(item, 'pet_friendly')))) return false;
        if (filters.professionalUse && !(item.professional_use || isTruthy(getValue(item, 'professional_use')))) return false;
      }
      if (isTourismContext) {
        const specs = getTourismSpecs(item);
        if (filters.tourismType && normalizeBasic(specs.tourism_type || '') !== normalizeBasic(filters.tourismType)) return false;
        if (filters.guests && toNumber(specs.capacity || getValue(item, 'capacity')) && toNumber(specs.capacity || getValue(item, 'capacity')) < toNumber(filters.guests)) return false;
        if (filters.instantBook && !isTruthy(specs.instant_book)) return false;
        if (filters.wifi && !isTruthy(specs.wifi)) return false;
        if (filters.breakfast && !isTruthy(specs.breakfast)) return false;
        if (filters.parking && !(isTruthy(specs.parking) || item.garage)) return false;
        if (filters.pool && !(isTruthy(specs.pool) || item.pool)) return false;
        if (filters.petFriendly && !isTruthy(specs.pet_friendly)) return false;
        if (filters.spa && !isTruthy(specs.spa)) return false;
        if (filters.gym && !isTruthy(specs.gym)) return false;
        if (filters.beachfront && !isTruthy(specs.beachfront)) return false;
        if (filters.checkIn && filters.checkOut) {
          const nights = calculateNights(filters.checkIn, filters.checkOut);
          if (!nights || hasBlockedDates(specs, filters.checkIn, filters.checkOut)) return false;
          if (specs.min_nights && nights < toNumber(specs.min_nights)) return false;
          if (specs.max_nights && nights > toNumber(specs.max_nights)) return false;
        }
      }
      if (filters.brand && normalizeBasic(getValue(item, 'brand')) !== normalizeBasic(filters.brand)) return false;
      if (filters.model && !normalizeBasic(getValue(item, 'model')).includes(normalizeBasic(filters.model))) return false;
      if (filters.year && toNumber(getValue(item, 'year')) < toNumber(filters.year)) return false;
      if (filters.fuel && normalizeBasic(getValue(item, 'fuel')).indexOf(normalizeBasic(filters.fuel)) === -1) return false;
      if (filters.kmMax && toNumber(getValue(item, 'km', 'kilometers')) > toNumber(filters.kmMax)) return false;
      if (filters.lengthMin && toNumber(getValue(item, 'length', 'loa')) < toNumber(filters.lengthMin)) return false;
      if (filters.beamMin && toNumber(getValue(item, 'beam')) < toNumber(filters.beamMin)) return false;
      if (filters.cabins && toNumber(getValue(item, 'cabins')) < toNumber(filters.cabins)) return false;
      if (filters.engine && !normalizeBasic(getValue(item, 'engine', 'motor')).includes(normalizeBasic(filters.engine))) return false;
      if (item.status === 'paused') return false;
      return true;
    });
  }, [items, filters]);

  const sortedFiltered = useMemo(() => {
    const q = normalizeText(filters.q || '');
    const hasRealImage = (item) => (item?.images || []).some((image) => (
      typeof image === 'string'
      && image
      && !/placeholder|casa-car-logo|data:image/i.test(image)
    ));
    const score = (item) => {
      const hay = normalizeText([item?.title, item?.category, item?.subtype, item?.city, item?.state, item?.country, item?.description].filter(Boolean).join(' '));
      let totalScore = 0;
      if (hasRealImage(item)) totalScore += 100;
      if (item?.is_premium) totalScore += 60;
      if (item?.highlighted || item?.featured) totalScore += 30;
      if (q && hay.includes(q)) totalScore += 25;
      totalScore += Math.min(20, Number(item?.views || 0) / 25);
      return totalScore;
    };
    const byDate = (a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
    return [...filtered].sort((a, b) => {
      if (filters.sort === 'price_asc') return toNumber(a.price || a.priceUsd || a.priceARS || 0) - toNumber(b.price || b.priceUsd || b.priceARS || 0);
      if (filters.sort === 'price_desc') return toNumber(b.price || b.priceUsd || b.priceARS || 0) - toNumber(a.price || a.priceUsd || a.priceARS || 0);
      if (filters.sort === 'views') return toNumber(b.views) - toNumber(a.views);
      if (filters.sort === 'premium') return (score(b) + (b?.is_premium ? 100 : 0)) - (score(a) + (a?.is_premium ? 100 : 0)) || byDate(a, b);
      if (filters.sort === 'relevance') return score(b) - score(a) || byDate(a, b);
      return byDate(a, b);
    });
  }, [filtered, filters.sort, filters.q]);

  const chips = useMemo(() => Object.entries(filters)
    .filter(([key, value]) => key !== 'sort' && value && String(value).trim && String(value).trim())
    .slice(0, 8), [filters]);

  async function saveSearch() {
    setSaveSearchMessage('');
    setSavingSearch(true);
    try {
      const response = await secureFetch('/api/secure/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: filters.q ? `Búsqueda: ${filters.q}` : `Búsqueda ${new Date().toLocaleDateString('es-AR')}`,
          filters,
          notify_email: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'No se pudo guardar');
      setSaveSearchMessage(t('search_saved_message', 'Búsqueda guardada con alertas.'));
    } catch (error) {
      setSaveSearchMessage(error.message || t('search_saved_error', 'Necesitás iniciar sesión para guardar alertas.'));
    } finally {
      setSavingSearch(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const query = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (typeof v === 'boolean') { if (v) query[k] = '1'; return; }
      if (String(v || '').trim()) query[k] = k === 'category' ? normalizeCategory(v) : v;
    });
    setPage(1);
    router.replace({ pathname: '/buscar', query: { ...query, page: 1 } }, undefined, { shallow: true });
  }

  function onClear() {
    setFilters(defaults);
    setPage(1);
    router.replace('/buscar');
  }

  const titleText = filters.category ? `${sortedFiltered.length} ${categoryLabel(filters.category)}` : `${total || sortedFiltered.length} ${t('search_results_found', 'anuncios encontrados')}`;
  const breadcrumbs = [
    { label: t('nav_home', 'Inicio'), href: '/' },
    { label: t('nav_search', 'Buscar'), href: '/buscar' },
    filters.category ? { label: categoryLabel(filters.category) } : null,
  ].filter(Boolean);
  const seoCategory = filters.category ? categoryLabel(filters.category) : 'anuncios';
  const seoTitle = filters.category
    ? `${seoCategory} en Casa-Car | Busqueda global`
    : 'Buscar anuncios en Casa-Car | Marketplace global';
  const seoDescription = filters.category
    ? `Explora ${seoCategory.toLowerCase()} en Casa-Car con filtros por ubicacion, precio, marca, ficha tecnica y publicaciones premium.`
    : 'Busca propiedades, autos, motos, camiones, maquinaria, nautica, turismo, servicios y carros de golf en Casa-Car.';
  const canonicalPath = filters.category ? `/buscar?category=${encodeURIComponent(filters.category)}` : '/buscar';
  const noindexSearch = Boolean(filters.q || filters.min || filters.max || filters.propertySubtype || filters.brand || filters.model || filters.year);
  const isTourismSearch = filters.category === 'Turismo';

  return (
    <div style={styles.page}>
      <SeoHead title={seoTitle} description={seoDescription} image="/casa-car-logo.png" url={canonicalPath} noindex={noindexSearch} />
      <SeoJsonLd data={buildOrganizationJsonLd()} />
      <SeoJsonLd data={buildItemListJsonLd(sortedFiltered, canonicalPath)} />
      <GlobalHeader />
      <div style={styles.wrap}>
        <Breadcrumbs items={breadcrumbs} />
        <div className="buscar-layout" style={styles.layout}>
          <aside className="buscar-sidebar" style={styles.sidebarCol}>
            <div style={styles.sidebarStickyBox}>
              <div style={styles.filterBox}>
                <SearchSidebar filters={filters} setFilters={setFilters} onSubmit={onSubmit} onClear={onClear} items={items} />
              </div>
              <div style={styles.sidebarAdBox}><AdSlot slot="search_sidebar" page="buscar" title={t('ads_results_title', 'Publicidad en resultados')} compact /></div>
            </div>
          </aside>
          <section style={styles.resultsCol}>
            <div style={styles.kicker}>{t('results_kicker', 'RESULTADOS')}</div>
            <div style={styles.headRow}>
              <div>
                <h1 style={styles.title}>{titleText}</h1>
                <p style={styles.subtitle}>{t('search_results_subtitle', 'Explorá propiedades, autos, motos, camiones, náutica, maquinaria, servicios, carros de golf / seguridad y turismo.')}</p>
              </div>
              <div style={styles.toolbar}>
                <select value={filters.sort} onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))} style={styles.select}>
                  <option value="recent">{t('sort_recent', 'Más recientes')}</option>
                  <option value="relevance">{t('sort_relevance', 'Relevancia')}</option>
                  <option value="premium">{t('sort_premium', 'Premium primero')}</option>
                  <option value="price_asc">{t('sort_price_low', 'Precio menor')}</option>
                  <option value="price_desc">{t('sort_price_high', 'Precio mayor')}</option>
                  <option value="views">{t('sort_most_viewed', 'Más vistos')}</option>
                </select>
                <button onClick={saveSearch} disabled={savingSearch} style={styles.saveBtn}>{savingSearch ? t('saving', 'Guardando…') : t('save_search', 'Guardar búsqueda')}</button>
              </div>
            </div>
            {saveSearchMessage ? <div style={styles.notice}>{saveSearchMessage}</div> : null}
            {chips.length ? <div style={styles.chips}>{chips.map(([key, value]) => <span key={key} style={styles.chip}>{filterChipLabel(key, t)}: {String(value)}</span>)}</div> : null}
            <div style={{ margin: '0 0 18px 0' }}><AdSlot slot="home_middle" page="buscar" title={t('sponsored_brands', 'Marcas patrocinadas')} /></div>
            {loading ? (
              <div className="buscar-grid" style={styles.grid}>{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}</div>
            ) : sortedFiltered.length ? (
              <>
                {isTourismSearch ? (
                  <div className="tourism-results" style={styles.tourismResults}>
                    <div className="buscar-grid" style={styles.grid}>{sortedFiltered.map((item) => <ListingCard key={item.id} item={item} />)}</div>
                    <TourismSearchMap items={sortedFiltered} />
                  </div>
                ) : (
                  <div className="buscar-grid" style={styles.grid}>{sortedFiltered.map((item) => <ListingCard key={item.id} item={item} />)}</div>
                )}
                <div style={styles.pagination}>
                  <button disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); router.replace({ pathname: '/buscar', query: { ...router.query, page: Math.max(1, page - 1) } }, undefined, { shallow: true }); }} style={styles.pageBtn}>{t('previous', 'Anterior')}</button>
                  <span style={styles.pageIndicator}>{t('page_of', 'Página')} {page} {t('of', 'de')} {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); router.replace({ pathname: '/buscar', query: { ...router.query, page: Math.min(totalPages, page + 1) } }, undefined, { shallow: true }); }} style={styles.pageBtn}>{t('next', 'Siguiente')}</button>
                </div>
              </>
            ) : (
              <EmptyState title={t('search_empty_title', 'No encontramos publicaciones')} text={t('search_empty_text', 'Probá cambiando la categoría, ubicación o rango de precio.')} />
            )}
          </section>
        </div>
      </div>
      <FooterBlueBar />
      <style jsx>{`
        .buscar-layout { display:grid; grid-template-columns:340px minmax(0,1fr); gap:24px; align-items:start; }
        .buscar-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,420px)); gap:18px; justify-content:start; }
        @media (max-width: 1280px) {
          .buscar-layout { grid-template-columns:1fr; }
          .buscar-sidebar { position:static !important; top:auto !important; max-height:none !important; }
          .tourism-results { grid-template-columns:1fr !important; }
        }
        @media (max-width: 800px) {
          .buscar-grid { grid-template-columns:1fr; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page:{ background:'#f5f7fb', minHeight:'100vh', fontFamily:'Arial, sans-serif' },
  wrap:{ maxWidth:1400, margin:'0 auto', padding:'28px 16px 40px' },
  layout:{},
  sidebarCol:{ minWidth:0, maxWidth:340, width:'100%', position:'sticky', top:88, alignSelf:'start' },
  sidebarStickyBox:{ display:'grid', gap:14, paddingRight:4 },
  filterBox:{ minWidth:0 },
  sidebarAdBox:{ minWidth:0 },
  resultsCol:{ minWidth:0 },
  kicker:{ fontSize:12, fontWeight:900, letterSpacing:'.16em', color:'#1d4ed8', marginBottom:10 },
  headRow:{ display:'flex', justifyContent:'space-between', gap:20, flexWrap:'wrap', alignItems:'flex-start' },
  title:{ fontSize:36, margin:'0 0 8px 0', color:'#111827' },
  subtitle:{ margin:'0 0 14px 0', color:'#6b7280', maxWidth:760 },
  toolbar:{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' },
  select:{ border:'1px solid #d1d5db', borderRadius:10, padding:'11px 12px', background:'#fff', fontWeight:700 },
  saveBtn:{ border:'none', borderRadius:10, padding:'11px 14px', background:'#111827', color:'#fff', fontWeight:800, cursor:'pointer' },
  notice:{ margin:'0 0 12px 0', background:'#ecfeff', border:'1px solid #a5f3fc', color:'#155e75', borderRadius:12, padding:'10px 12px', fontWeight:700 },
  chips:{ display:'flex', flexWrap:'wrap', gap:8, margin:'0 0 14px 0' },
  chip:{ padding:'7px 10px', borderRadius:999, background:'#e2e8f0', color:'#0f172a', fontWeight:700, fontSize:12 },
  grid:{},
  tourismResults:{display:'grid',gridTemplateColumns:'minmax(0,1fr) 360px',gap:18,alignItems:'start'},
  pagination:{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, marginTop:20, flexWrap:'wrap' },
  pageBtn:{ border:'1px solid #d1d5db', background:'#fff', borderRadius:10, padding:'10px 14px', fontWeight:800, cursor:'pointer' },
  pageIndicator:{ fontWeight:800, color:'#334155' },
};
