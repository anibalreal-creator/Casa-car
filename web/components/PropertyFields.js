import { useLang } from '../context/LanguageContext';

const CONSTRUCTION_STATUS = ['', 'En construcción', 'En pozo', 'Terminado'];
const ADVERTISER_TYPES = ['', 'Dueño directo', 'Inmobiliaria'];
const COMMISSION_TYPES = ['', 'No especificado', 'No compartir', 'Compartir 30%', 'Compartir 50%'];

export default function PropertyFields({ formData, setFormData }) {
  const { t } = useLang();
  function update(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>{t('property_data', 'Datos de la propiedad')}</h3>
      <div style={styles.grid}>
        <input style={styles.input} type="number" placeholder={t('property_rooms', 'Habitaciones')} value={formData.rooms || ''} onChange={(e) => update('rooms', e.target.value)} />
        <input style={styles.input} type="number" placeholder={t('property_bathrooms', 'Baños')} value={formData.bathrooms || ''} onChange={(e) => update('bathrooms', e.target.value)} />
        <input style={styles.input} type="number" placeholder={t('property_covered_surface', 'Superficie cubierta m²')} value={formData.surface || ''} onChange={(e) => update('surface', e.target.value)} />
      </div>
      <div style={styles.grid}>
        <input style={styles.input} type="number" placeholder={t('property_total_surface', 'Superficie total m²')} value={formData.total_surface || ''} onChange={(e) => update('total_surface', e.target.value)} />
        <input style={styles.input} type="number" placeholder={t('property_garages', 'Cocheras')} value={formData.garages_count || ''} onChange={(e) => update('garages_count', e.target.value)} />
        <input style={styles.input} type="number" placeholder={t('property_antiquity', 'Antigüedad (años)')} value={formData.antiquity || ''} onChange={(e) => update('antiquity', e.target.value)} />
      </div>
      <div style={styles.grid}>
        <input style={styles.input} type="number" placeholder={t('property_floor', 'Piso')} value={formData.floor || ''} onChange={(e) => update('floor', e.target.value)} />
        <input style={styles.input} type="number" placeholder={t('property_toilets', 'Toilette')} value={formData.toilets || ''} onChange={(e) => update('toilets', e.target.value)} />
        <input style={styles.input} placeholder={t('property_orientation', 'Disposición / orientación')} value={formData.orientation || ''} onChange={(e) => update('orientation', e.target.value)} />
      </div>
      <div style={styles.grid}>
        <select style={styles.input} value={formData.construction_status || ''} onChange={(e) => update('construction_status', e.target.value)}>
          {CONSTRUCTION_STATUS.map((option) => <option key={option || 'ind'} value={option}>{option || t('property_construction_status', 'Estado de obra')}</option>)}
        </select>
        <select style={styles.input} value={formData.advertiser_type || ''} onChange={(e) => update('advertiser_type', e.target.value)}>
          {ADVERTISER_TYPES.map((option) => <option key={option || 'ind'} value={option}>{option || t('property_advertiser_type', 'Tipo de anunciante')}</option>)}
        </select>
        <select style={styles.input} value={formData.commission_share || ''} onChange={(e) => update('commission_share', e.target.value)}>
          {COMMISSION_TYPES.map((option) => <option key={option || 'ind'} value={option}>{option || t('property_commission', 'Comparte comisión')}</option>)}
        </select>
      </div>
      <div style={styles.checks}>
        <label><input type="checkbox" checked={!!formData.pool} onChange={(e) => update('pool', e.target.checked)} /> {t('amenity_pool', 'Pileta')}</label>
        <label><input type="checkbox" checked={!!formData.garage} onChange={(e) => update('garage', e.target.checked)} /> {t('amenity_garage', 'Cochera')}</label>
        <label><input type="checkbox" checked={!!formData.furnished} onChange={(e) => update('furnished', e.target.checked)} /> {t('amenity_furnished', 'Amueblado')}</label>
        <label><input type="checkbox" checked={!!formData.patio} onChange={(e) => update('patio', e.target.checked)} /> {t('amenity_patio', 'Patio')}</label>
        <label><input type="checkbox" checked={!!formData.balcony} onChange={(e) => update('balcony', e.target.checked)} /> {t('amenity_balcony', 'Balcón')}</label>
        <label><input type="checkbox" checked={!!formData.terrace} onChange={(e) => update('terrace', e.target.checked)} /> {t('amenity_terrace', 'Terraza')}</label>
        <label><input type="checkbox" checked={!!formData.sum} onChange={(e) => update('sum', e.target.checked)} /> {t('amenity_sum', 'SUM')}</label>
        <label><input type="checkbox" checked={!!formData.security24h} onChange={(e) => update('security24h', e.target.checked)} /> {t('amenity_security24', 'Seguridad 24 hs')}</label>
        <label><input type="checkbox" checked={!!formData.pet_friendly} onChange={(e) => update('pet_friendly', e.target.checked)} /> {t('amenity_pet', 'Apto mascotas')}</label>
        <label><input type="checkbox" checked={!!formData.professional_use} onChange={(e) => update('professional_use', e.target.checked)} /> {t('amenity_professional', 'Apto profesional')}</label>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'grid', gap: 12, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, minWidth: 0, maxWidth: '100%', overflow: 'hidden' },
  title: { margin: 0, fontSize: 18 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 12, minWidth: 0 },
  input: { width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', padding: '14px 16px', border: '1px solid #d1d5db', borderRadius: 12, fontSize: 16, background: '#fff' },
  checks: { display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 15, minWidth: 0 }
};
