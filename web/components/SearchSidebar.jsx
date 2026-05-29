import { useMemo } from "react";
import { useLang } from "../context/LanguageContext";
import { GLOBAL_COUNTRIES } from "../data/globalConfig";
import { INTERNATIONAL_LOCATIONS } from "../data/locations";
import { SUBTYPES } from "../data/options";
import { TOURISM_AMENITIES, tourismText } from "../lib/tourism";

const CATEGORY_OPTIONS = [
  { value: '', key: 'search_all_categories', fallback: 'Todas las categorías' },
  { value: 'Propiedad', key: 'cat_properties', fallback: 'Propiedades' },
  { value: 'Auto', key: 'cat_cars', fallback: 'Autos' },
  { value: 'Carros de golf / seguridad', key: 'cat_golf_security', fallback: 'Carros de golf / seguridad' },
  { value: 'Moto', key: 'cat_motorcycles', fallback: 'Motos' },
  { value: 'Camión', key: 'cat_trucks', fallback: 'Camiones' },
  { value: 'Náutica', key: 'cat_nautical', fallback: 'Náutica' },
  { value: 'Maquinaria', key: 'cat_machinery', fallback: 'Maquinaria' },
  { value: 'Servicio', key: 'cat_services', fallback: 'Servicios' },
  { value: 'Turismo', key: 'cat_tourism', fallback: 'Turismo' }
];

const CONSTRUCTION_STATUS = [
  { value: '', key: 'property_construction_status', fallback: 'Estado de obra' },
  { value: 'En construcción', key: 'construction_in_progress', fallback: 'En construcción' },
  { value: 'En pozo', key: 'construction_presale', fallback: 'En pozo' },
  { value: 'Terminado', key: 'construction_finished', fallback: 'Terminado' },
];
const ADVERTISER_TYPES = [
  { value: '', key: 'property_advertiser_type', fallback: 'Tipo de anunciante' },
  { value: 'Dueño directo', key: 'advertiser_owner', fallback: 'Dueño directo' },
  { value: 'Inmobiliaria', key: 'advertiser_agency', fallback: 'Inmobiliaria' },
];
const COMMISSION_TYPES = [
  { value: '', key: 'property_commission', fallback: 'Comparte comisión' },
  { value: 'No especificado', key: 'commission_unspecified', fallback: 'No especificado' },
  { value: 'No compartir', key: 'commission_no_share', fallback: 'No compartir' },
  { value: 'Compartir 30%', key: 'commission_share_30', fallback: 'Compartir 30%' },
  { value: 'Compartir 50%', key: 'commission_share_50', fallback: 'Compartir 50%' },
];

const AUTO_BRANDS = ['', 'BMW', 'Audi', 'Mercedes-Benz', 'Toyota', 'Volkswagen', 'Ford', 'Chevrolet', 'Honda', 'Nissan', 'Peugeot', 'Renault'];
const MACHINE_BRANDS = ['', 'Caterpillar', 'John Deere', 'Komatsu', 'New Holland', 'Case', 'Massey Ferguson', 'JCB', 'Volvo CE'];
const NAUTICA_BRANDS = ['', 'Bayliner', 'Sea Ray', 'Beneteau', 'Jeanneau', 'Yamaha', 'Quicksilver', 'Regal'];
const GOLF_BRANDS = ['', 'Club Car', 'EZGO', 'Yamaha', 'Star EV', 'Evolution', 'Tomberlin'];
const FUEL_OPTIONS = ['', 'Nafta', 'Diesel', 'Hibrido', 'Electrico', 'GNC'];

function unique(values = []) {
  return [...new Set(values.filter(Boolean).map((v) => String(v).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getSpecs(item) {
  return item?.specs_json && typeof item.specs_json === 'object' ? item.specs_json : {};
}

function collectFromItems(items, keys = []) {
  const values = [];
  items.forEach((item) => {
    const specs = getSpecs(item);
    keys.forEach((key) => {
      if (item?.[key]) values.push(item[key]);
      if (specs?.[key]) values.push(specs[key]);
    });
  });
  return unique(values);
}

export default function SearchSidebar({ filters, setFilters, onSubmit, onClear, items = [] }) {
  const { t, language } = useLang();
  const tr = (key) => tourismText(language, key);
  const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const selectedCountry = filters.country || '';
  const statesFromData = selectedCountry ? Object.keys(INTERNATIONAL_LOCATIONS?.[selectedCountry] || {}) : [];
  const citiesFromData = selectedCountry && filters.state
    ? Object.keys(INTERNATIONAL_LOCATIONS?.[selectedCountry]?.[filters.state] || {})
    : [];

  const statesFromItems = useMemo(() => collectFromItems(items.filter((item) => !selectedCountry || item?.country === selectedCountry), ['state']), [items, selectedCountry]);
  const citiesFromItems = useMemo(() => collectFromItems(items.filter((item) => {
    if (selectedCountry && item?.country !== selectedCountry) return false;
    if (filters.state && item?.state !== filters.state) return false;
    return true;
  }), ['city']), [items, selectedCountry, filters.state]);

  const stateOptions = unique([...statesFromData, ...statesFromItems]);
  const cityOptions = unique([...citiesFromData, ...citiesFromItems]);

  const showProperty = !filters.category || filters.category === 'Propiedad';
  const showAuto = filters.category === 'Auto' || filters.category === 'Moto' || filters.category === 'Camión';
  const showMachinery = filters.category === 'Maquinaria';
  const showNautica = filters.category === 'Náutica';
  const showGolf = filters.category === 'Carros de golf / seguridad';
  const showTourism = filters.category === 'Turismo';

  const propertySubtypes = useMemo(() => unique(['', ...(SUBTYPES.Propiedad || []), ...collectFromItems(items.filter((item) => item?.category === 'Propiedad'), ['subtype'])]), [items]);
  const autoBrands = useMemo(() => unique([...AUTO_BRANDS, ...collectFromItems(items.filter((item) => ['Auto', 'Moto', 'Camión'].includes(item?.category)), ['brand'])]), [items]);
  const machineBrands = useMemo(() => unique([...MACHINE_BRANDS, ...collectFromItems(items.filter((item) => item?.category === 'Maquinaria'), ['brand'])]), [items]);
  const nauticaBrands = useMemo(() => unique([...NAUTICA_BRANDS, ...collectFromItems(items.filter((item) => item?.category === 'Náutica'), ['brand'])]), [items]);
  const golfBrands = useMemo(() => unique([...GOLF_BRANDS, ...collectFromItems(items.filter((item) => item?.category === 'Carros de golf / seguridad'), ['brand'])]), [items]);

  const autoModels = useMemo(() => collectFromItems(items.filter((item) => ['Auto', 'Moto', 'Camión'].includes(item?.category)), ['model']), [items]);
  const machineModels = useMemo(() => collectFromItems(items.filter((item) => item?.category === 'Maquinaria'), ['model']), [items]);
  const nauticaModels = useMemo(() => collectFromItems(items.filter((item) => item?.category === 'Náutica'), ['model']), [items]);
  const golfModels = useMemo(() => collectFromItems(items.filter((item) => item?.category === 'Carros de golf / seguridad'), ['model']), [items]);

  return (
    <form onSubmit={onSubmit} style={styles.sidebar}>
      <div style={styles.topBar}>
        <div style={styles.kicker}>{t('filter_real_search', 'BUSCADOR REAL')}</div>
        <div style={styles.microHint}>{t('filter_independent_scroll', 'Scroll independiente')}</div>
      </div>

      <h2 style={styles.title}>{t('filter_title', 'Filtrá anuncios')}</h2>
      <div style={styles.subtitle}>{t('filter_subtitle', 'Ajustá filtros sin mover la grilla de resultados.')}</div>

      <div style={styles.scrollArea}>
        <div style={styles.sectionBox}>
          <strong style={styles.sectionTitle}>{t('filter_general', 'Generales')}</strong>
          <input value={filters.q} onChange={(e)=>set('q', e.target.value)} placeholder={t('filter_what', 'Qué buscás')} style={styles.input} />
          <select value={filters.category} onChange={(e)=>set('category', e.target.value)} style={styles.input}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.key} value={option.value}>{t(option.key, option.fallback)}</option>
            ))}
          </select>
          <select value={filters.country} onChange={(e)=>{
            set('country', e.target.value);
            set('state', '');
            set('city', '');
          }} style={styles.input}>
            <option value="">{t('filter_country', 'País')}</option>
            {GLOBAL_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
          <select value={filters.state || ''} onChange={(e)=>{
            set('state', e.target.value);
            set('city', '');
          }} style={styles.input}>
            <option value="">{t('publish_state', 'Provincia / estado')}</option>
            {stateOptions.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <select value={filters.city || ''} onChange={(e)=>set('city', e.target.value)} style={styles.input}>
            <option value="">{t('publish_city', 'Ciudad')}</option>
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <select value={filters.type} onChange={(e)=>set('type', e.target.value)} style={styles.input}>
            <option value="">{t('filter_operation', 'Tipo de operación')}</option>
            <option value="venta">{t('search_sale', 'Venta')}</option>
            <option value="alquiler">{t('search_rent', 'Alquiler')}</option>
            <option value="temporal">{t('search_temporary', 'Alquiler temporal')}</option>
          </select>
          <div style={styles.prices}>
            <input value={filters.min} onChange={(e)=>set('min', e.target.value)} placeholder={t('filter_min_price', 'Precio min.')} style={styles.input} />
            <input value={filters.max} onChange={(e)=>set('max', e.target.value)} placeholder={t('filter_max_price', 'Precio máx.')} style={styles.input} />
          </div>
        </div>

        {showProperty ? (
          <div style={styles.advancedBox}>
            <strong style={styles.sectionTitle}>{t('filter_property', 'Filtros de propiedades')}</strong>
            <select value={filters.propertySubtype || ''} onChange={(e)=>set('propertySubtype', e.target.value)} style={styles.input}>
              {propertySubtypes.map((option) => <option key={option || 'all'} value={option}>{option || t('filter_property_subtype', 'Subtipo de propiedad')}</option>)}
            </select>
            <div style={styles.prices}>
              <input value={filters.rooms || ''} onChange={(e)=>set('rooms', e.target.value)} placeholder={t('filter_bedrooms', 'Dormitorios')} style={styles.input} />
              <input value={filters.bathrooms || ''} onChange={(e)=>set('bathrooms', e.target.value)} placeholder={t('property_bathrooms', 'Baños')} style={styles.input} />
            </div>
            <input value={filters.surface || ''} onChange={(e)=>set('surface', e.target.value)} placeholder={t('filter_min_surface', 'm² mínimos')} style={styles.input} />
            <select value={filters.constructionStatus || ''} onChange={(e)=>set('constructionStatus', e.target.value)} style={styles.input}>
              {CONSTRUCTION_STATUS.map((option) => <option key={option.key} value={option.value}>{t(option.key, option.fallback)}</option>)}
            </select>
            <select value={filters.advertiserType || ''} onChange={(e)=>set('advertiserType', e.target.value)} style={styles.input}>
              {ADVERTISER_TYPES.map((option) => <option key={option.key} value={option.value}>{t(option.key, option.fallback)}</option>)}
            </select>
            <select value={filters.commissionShare || ''} onChange={(e)=>set('commissionShare', e.target.value)} style={styles.input}>
              {COMMISSION_TYPES.map((option) => <option key={option.key} value={option.value}>{t(option.key, option.fallback)}</option>)}
            </select>
            <div style={styles.checks}>
              <label><input type="checkbox" checked={!!filters.balcony} onChange={(e)=>set('balcony', e.target.checked)} /> {t('amenity_balcony', 'Balcón')}</label>
              <label><input type="checkbox" checked={!!filters.patio} onChange={(e)=>set('patio', e.target.checked)} /> {t('amenity_patio', 'Patio')}</label>
              <label><input type="checkbox" checked={!!filters.pool} onChange={(e)=>set('pool', e.target.checked)} /> {t('amenity_pool', 'Pileta')}</label>
              <label><input type="checkbox" checked={!!filters.garage} onChange={(e)=>set('garage', e.target.checked)} /> {t('amenity_garage', 'Cochera')}</label>
              <label><input type="checkbox" checked={!!filters.furnished} onChange={(e)=>set('furnished', e.target.checked)} /> {t('amenity_furnished', 'Amueblado')}</label>
              <label><input type="checkbox" checked={!!filters.terrace} onChange={(e)=>set('terrace', e.target.checked)} /> {t('amenity_terrace', 'Terraza')}</label>
              <label><input type="checkbox" checked={!!filters.sum} onChange={(e)=>set('sum', e.target.checked)} /> {t('amenity_sum', 'SUM')}</label>
              <label><input type="checkbox" checked={!!filters.security24h} onChange={(e)=>set('security24h', e.target.checked)} /> {t('amenity_security24', 'Seguridad 24 hs')}</label>
              <label><input type="checkbox" checked={!!filters.petFriendly} onChange={(e)=>set('petFriendly', e.target.checked)} /> {t('amenity_pet', 'Apto mascotas')}</label>
              <label><input type="checkbox" checked={!!filters.professionalUse} onChange={(e)=>set('professionalUse', e.target.checked)} /> {t('amenity_professional', 'Apto profesional')}</label>
            </div>
          </div>
        ) : null}

        {showAuto ? (
          <div style={styles.advancedBox}>
            <strong style={styles.sectionTitle}>{t('filter_auto_group', 'Autos / motos / camiones')}</strong>
            <select value={filters.brand || ''} onChange={(e)=>set('brand', e.target.value)} style={styles.input}>
              {autoBrands.map((brand) => <option key={brand || 'all'} value={brand}>{brand || t('brand_label', 'Marca')}</option>)}
            </select>
            <input list="auto-models" value={filters.model || ''} onChange={(e)=>set('model', e.target.value)} placeholder={t('model_label', 'Modelo')} style={styles.input} />
            <datalist id="auto-models">{autoModels.map((model) => <option key={model} value={model} />)}</datalist>
            <div style={styles.prices}>
              <input value={filters.year || ''} onChange={(e)=>set('year', e.target.value)} placeholder={t('year_from', 'Año desde')} style={styles.input} />
              <input value={filters.kmMax || ''} onChange={(e)=>set('kmMax', e.target.value)} placeholder={t('filter_max_km', 'Km max.')} style={styles.input} />
            </div>
            <select value={filters.fuel || ''} onChange={(e)=>set('fuel', e.target.value)} style={styles.input}>
              {FUEL_OPTIONS.map((fuel) => <option key={fuel || 'all'} value={fuel}>{fuel || t('filter_fuel', 'Combustible')}</option>)}
            </select>
          </div>
        ) : null}

        {showMachinery ? (
          <div style={styles.advancedBox}>
            <strong style={styles.sectionTitle}>{t('filter_machinery_group', 'Maquinaria')}</strong>
            <select value={filters.brand || ''} onChange={(e)=>set('brand', e.target.value)} style={styles.input}>
              {machineBrands.map((brand) => <option key={brand || 'all'} value={brand}>{brand || t('brand_label', 'Marca')}</option>)}
            </select>
            <input list="machine-models" value={filters.model || ''} onChange={(e)=>set('model', e.target.value)} placeholder={t('model_label', 'Modelo')} style={styles.input} />
            <datalist id="machine-models">{machineModels.map((model) => <option key={model} value={model} />)}</datalist>
            <input value={filters.year || ''} onChange={(e)=>set('year', e.target.value)} placeholder={t('year_from', 'Año desde')} style={styles.input} />
          </div>
        ) : null}

        {showNautica ? (
          <div style={styles.advancedBox}>
            <strong style={styles.sectionTitle}>{t('filter_nautical_group', 'Náutica')}</strong>
            <select value={filters.brand || ''} onChange={(e)=>set('brand', e.target.value)} style={styles.input}>
              {nauticaBrands.map((brand) => <option key={brand || 'all'} value={brand}>{brand || t('brand_label', 'Marca')}</option>)}
            </select>
            <input list="nautica-models" value={filters.model || ''} onChange={(e)=>set('model', e.target.value)} placeholder={t('model_label', 'Modelo')} style={styles.input} />
            <datalist id="nautica-models">{nauticaModels.map((model) => <option key={model} value={model} />)}</datalist>
            <div style={styles.prices}>
              <input value={filters.year || ''} onChange={(e)=>set('year', e.target.value)} placeholder={t('year_from', 'Año desde')} style={styles.input} />
              <input value={filters.cabins || ''} onChange={(e)=>set('cabins', e.target.value)} placeholder={t('filter_cabins_min', 'Cabinas min.')} style={styles.input} />
            </div>
            <div style={styles.prices}>
              <input value={filters.lengthMin || ''} onChange={(e)=>set('lengthMin', e.target.value)} placeholder={t('filter_length_min', 'Eslora min.')} style={styles.input} />
              <input value={filters.beamMin || ''} onChange={(e)=>set('beamMin', e.target.value)} placeholder={t('filter_beam_min', 'Manga min.')} style={styles.input} />
            </div>
            <input value={filters.engine || ''} onChange={(e)=>set('engine', e.target.value)} placeholder={t('filter_engine', 'Motor')} style={styles.input} />
          </div>
        ) : null}

        {showGolf ? (
          <div style={styles.advancedBox}>
            <strong style={styles.sectionTitle}>{t('filter_golf_group', 'Carros de golf / seguridad')}</strong>
            <select value={filters.brand || ''} onChange={(e)=>set('brand', e.target.value)} style={styles.input}>
              {golfBrands.map((brand) => <option key={brand || 'all'} value={brand}>{brand || t('brand_label', 'Marca')}</option>)}
            </select>
            <input list="golf-models" value={filters.model || ''} onChange={(e)=>set('model', e.target.value)} placeholder={t('model_label', 'Modelo')} style={styles.input} />
            <datalist id="golf-models">{golfModels.map((model) => <option key={model} value={model} />)}</datalist>
            <input value={filters.year || ''} onChange={(e)=>set('year', e.target.value)} placeholder={t('year_from', 'Año desde')} style={styles.input} />
          </div>
        ) : null}

        {showTourism ? (
          <div style={styles.advancedBox}>
            <strong style={styles.sectionTitle}>{tr('booking_filters')}</strong>
            <select value={filters.tourismType || ''} onChange={(e)=>set('tourismType', e.target.value)} style={styles.input}>
              <option value="">{tr('tourism_type')}</option>
              <option value="stay">{tr('stay')}</option>
              <option value="experience">{tr('experience')}</option>
              <option value="rental">{tr('rental')}</option>
            </select>
            <div style={styles.prices}>
              <input type="date" value={filters.checkIn || ''} onChange={(e)=>set('checkIn', e.target.value)} aria-label={tr('checkin')} style={styles.input} />
              <input type="date" value={filters.checkOut || ''} onChange={(e)=>set('checkOut', e.target.value)} aria-label={tr('checkout')} style={styles.input} />
            </div>
            <input type="number" min="1" value={filters.guests || ''} onChange={(e)=>set('guests', e.target.value)} placeholder={tr('guests')} style={styles.input} />
            <div style={styles.checks}>
              <label><input type="checkbox" checked={!!filters.instantBook} onChange={(e)=>set('instantBook', e.target.checked)} /> {tr('instant_book')}</label>
              {TOURISM_AMENITIES.filter((key) => ['wifi','breakfast','parking','pool','pet_friendly','spa','gym','beachfront'].includes(key)).map((key) => {
                const filterKey = key === 'pet_friendly' ? 'petFriendly' : key;
                return (
                  <label key={key}><input type="checkbox" checked={!!filters[filterKey]} onChange={(e)=>set(filterKey, e.target.checked)} /> {tr(key)}</label>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div style={styles.actions}>
        <button type="submit" style={styles.button}>{t('search_button', 'Buscar')}</button>
        <button type="button" onClick={onClear} style={styles.clear}>{t('filter_clear', 'Limpiar')}</button>
      </div>
    </form>
  );
}

const styles = {
  sidebar:{
    background:'#fff',
    border:'1px solid #e5e7eb',
    borderRadius:24,
    padding:20,
    boxShadow:'0 18px 40px rgba(15,23,42,.06)',
    display:'grid',
    gridTemplateRows:'auto auto minmax(0, 1fr) auto',
    gap:12,
    width:'100%',
    boxSizing:'border-box',
    height:'calc(100vh - 116px)',
    minHeight:0,
    overflow:'hidden'
  },
  topBar:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'},
  kicker:{display:'inline-block',padding:'6px 10px',borderRadius:999,background:'#ede9fe',color:'#6d28d9',fontWeight:800,fontSize:12,letterSpacing:'.08em'},
  microHint:{fontSize:12,fontWeight:800,color:'#64748b'},
  title:{fontSize:28,margin:'0',lineHeight:1.08,color:'#111827'},
  subtitle:{fontSize:14,color:'#6b7280',lineHeight:1.5,marginTop:-4},
  sectionTitle:{fontSize:16,color:'#111827'},
  sectionBox:{display:'grid',gap:10},
  scrollArea:{
    display:'grid',
    alignContent:'start',
    gap:12,
    minHeight:0,
    overflowY:'auto',
    overscrollBehavior:'contain',
    paddingRight:4,
    scrollbarWidth:'thin'
  },
  input:{padding:'13px 14px',border:'1px solid #d1d5db',borderRadius:12,fontSize:15,width:'100%',boxSizing:'border-box',background:'#fff'},
  prices:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10},
  advancedBox:{display:'grid',gap:10,background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:16,padding:12},
  checks:{display:'flex',flexWrap:'wrap',gap:12,fontSize:14},
  actions:{display:'grid',gap:10,marginTop:2},
  button:{border:'none',background:'linear-gradient(90deg,#111827,#1d4ed8)',color:'#fff',padding:'14px 18px',borderRadius:12,fontWeight:800,cursor:'pointer'},
  clear:{border:'1px solid #d1d5db',background:'#fff',color:'#111827',padding:'13px 18px',borderRadius:12,fontWeight:800,cursor:'pointer'}
};
