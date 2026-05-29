import Link from 'next/link';
import { useLang } from '../context/LanguageContext';

const CATEGORY_OPTIONS = [
  { value: '', key: 'search_all_categories', fallback: 'Categoría' },
  { value: 'propiedades', key: 'cat_properties', fallback: 'Propiedades' },
  { value: 'autos', key: 'cat_cars', fallback: 'Autos' },
  { value: 'motos', key: 'cat_motorcycles', fallback: 'Motos' },
  { value: 'camiones', key: 'cat_trucks', fallback: 'Camiones' },
  { value: 'nautica', key: 'cat_nautical', fallback: 'Náutica' },
  { value: 'maquinaria', key: 'cat_machinery', fallback: 'Maquinaria' },
  { value: 'servicios', key: 'cat_services', fallback: 'Servicios' },
  { value: 'turismo', key: 'cat_tourism', fallback: 'Turismo' },
  { value: 'carros de golf / seguridad', key: 'cat_golf_security', fallback: 'Carros de golf / seguridad' },
];

const COUNTRY_OPTIONS = ['', 'Argentina', 'Brasil', 'Estados Unidos', 'México'];
const STATE_OPTIONS = ['', 'Santa Fe', 'Buenos Aires', 'Córdoba', 'Florida'];
const CITY_OPTIONS = ['', 'Santa Fe', 'Rosario', 'Buenos Aires', 'Miami'];

export default function SearchMarketplaceHero({
  search = '', setSearch = () => {},
  country = '', setCountry = () => {},
  state = '', setState = () => {},
  city = '', setCity = () => {},
  category = '', setCategory = () => {},
  listingType = '', setListingType = () => {},
  onSubmit = (e) => e.preventDefault(),
}) {
  const { t } = useLang();

  const categoryLabel = (item) => t(item.key, item.fallback);

  return (
    <section style={styles.outer}>
      <div className="cc-search-header" style={styles.headerRow}>
        <div>
          <div style={styles.kicker}>{t('smart_search_kicker', 'BUSCADOR INTELIGENTE')}</div>
          <h2 className="cc-search-title" style={styles.title}>{t('smart_search_title', 'Buscá o filtrá en segundos')}</h2>
          <p style={styles.subtitle}>{t('smart_search_subtitle', 'Elegí categoría, país, provincia, ciudad y operación para encontrar resultados más rápido.')}</p>
        </div>
        <div style={styles.miniBadges}>
          {[t('badge_premium', 'Avisos premium'), t('badge_sponsored', 'Empresas patrocinadas'), t('badge_conversion', 'Foco en conversión')].map((badge) => (
            <span key={badge} style={styles.badge}>{badge}</span>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="cc-search-form" style={styles.form}>
        <div className="cc-search-field-search" style={styles.fieldSearch}>
          <label style={styles.label}>{t('search_label', 'Buscar')}</label>
          <input style={styles.search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search_placeholder', 'Título, ciudad, país, zona o dirección')} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('search_category', 'Categoría')}</label>
          <select style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map((item) => <option key={item.value || 'all'} value={item.value}>{categoryLabel(item)}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('search_country', 'País')}</label>
          <select style={styles.input} value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRY_OPTIONS.map((item) => <option key={item || 'all'} value={item}>{item || t('search_all_countries', 'Todos los países')}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('search_state', 'Provincia')}</label>
          <select style={styles.input} value={state} onChange={(e) => setState(e.target.value)}>
            {STATE_OPTIONS.map((item) => <option key={item || 'all'} value={item}>{item || t('search_all_states', 'Todas las provincias')}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('search_city', 'Ciudad')}</label>
          <select style={styles.input} value={city} onChange={(e) => setCity(e.target.value)}>
            {CITY_OPTIONS.map((item) => <option key={item || 'all'} value={item}>{item || t('search_all_cities', 'Todas las ciudades')}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('search_operation', 'Operación')}</label>
          <select style={styles.input} value={listingType} onChange={(e) => setListingType(e.target.value)}>
            <option value="">{t('search_sale_rent', 'Venta y alquiler')}</option>
            <option value="venta">{t('search_sale', 'Venta')}</option>
            <option value="alquiler">{t('search_rent', 'Alquiler')}</option>
            <option value="temporal">{t('search_temporary', 'Alquiler temporal')}</option>
          </select>
        </div>

        <button type="submit" style={styles.button}>{t('search_button', 'Buscar')}</button>
      </form>

      <div style={styles.helper}>{t('search_helper', 'Resultados priorizados por premium, rendimiento y frescura del aviso.')}</div>

      <div style={styles.quickWrap}>
        <div style={styles.quickTitle}>{t('quick_access', 'Accesos rápidos')}</div>
        <div style={styles.quickList}>
          {[
            { label: categoryLabel(CATEGORY_OPTIONS[1]), href: '/buscar?category=Propiedad' },
            { label: categoryLabel(CATEGORY_OPTIONS[2]), href: '/buscar?category=Auto' },
            { label: categoryLabel(CATEGORY_OPTIONS[3]), href: '/buscar?category=Moto' },
            { label: categoryLabel(CATEGORY_OPTIONS[5]), href: '/buscar?category=Náutica' },
            { label: categoryLabel(CATEGORY_OPTIONS[6]), href: '/buscar?category=Maquinaria' },
            { label: categoryLabel(CATEGORY_OPTIONS[7]), href: '/buscar?category=Servicio' },
            { label: categoryLabel(CATEGORY_OPTIONS[8]), href: '/buscar?category=Turismo' },
            { label: categoryLabel(CATEGORY_OPTIONS[9]), href: '/buscar?category=Carros%20de%20golf%20%2F%20seguridad' },
          ].map((chip) => (
            <Link key={chip.label} href={chip.href} style={styles.quickChip}>{chip.label}</Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1380px) {
          .cc-search-form {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          .cc-search-field-search {
            grid-column: 1 / -1 !important;
          }
        }

        @media (max-width: 980px) {
          .cc-search-header { flex-direction: column; }
          .cc-search-title { font-size: 30px !important; }
          .cc-search-form { grid-template-columns: 1fr !important; }
          .cc-search-field-search { min-width: 0 !important; }
        }
        @media (max-width: 640px) {
          .cc-search-title { font-size: 26px !important; }
        }
      `}</style>
    </section>
  );
}

const styles = {
  outer: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 28, padding: 24, boxShadow: '0 16px 40px rgba(15,23,42,.08)' },
  headerRow: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' },
  kicker: { display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: '#ede9fe', color: '#6d28d9', fontWeight: 800, fontSize: 12, letterSpacing: '.08em', marginBottom: 10 },
  title: { fontSize: 36, lineHeight: 1.02, margin: '0 0 8px 0', color: '#111827', fontWeight: 900, letterSpacing: '-.03em' },
  subtitle: { fontSize: 16, lineHeight: 1.55, color: '#6b7280', margin: 0, maxWidth: 740 },
  miniBadges: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  badge: { padding: '8px 10px', borderRadius: 999, background: '#f3f4f6', color: '#111827', fontWeight: 800, fontSize: 12 },
  form: { display: 'grid', gridTemplateColumns: 'minmax(260px,2fr) repeat(5, minmax(122px,1fr))', gap: 12, marginTop: 20, alignItems: 'end' },
  fieldSearch: { minWidth: 0 },
  field: { minWidth: 0 },
  label: { display: 'block', fontSize: 12, fontWeight: 900, color: '#374151', margin: '0 0 6px 4px' },
  search: { width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '14px 14px', border: '1px solid #d1d5db', borderRadius: 14, fontSize: 15 },
  input: { width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '13px 12px', border: '1px solid #d1d5db', borderRadius: 14, fontSize: 14, background: '#fff' },
  button: { gridColumn: '1 / -1', border: 'none', background: 'linear-gradient(90deg,#111827,#1d4ed8)', color: '#fff', padding: '17px 18px', borderRadius: 14, fontWeight: 900, cursor: 'pointer', fontSize: 18, marginTop: 2 },
  helper: { fontSize: 13, color: '#6b7280', marginTop: 12 },
  quickWrap: { marginTop: 18 },
  quickTitle: { fontSize: 14, fontWeight: 900, color: '#111827', marginBottom: 10 },
  quickList: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  quickChip: { textDecoration: 'none', background: '#fff', border: '1px solid #d1d5db', color: '#111827', padding: '10px 14px', borderRadius: 999, fontWeight: 800, fontSize: 13 },
};
