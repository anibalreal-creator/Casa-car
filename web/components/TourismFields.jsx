import { useLang } from "../context/LanguageContext";
import { TOURISM_AMENITIES, TOURISM_EXPERIENCE_TYPES, TOURISM_RENTAL_TYPES, tourismText } from "../lib/tourism";

export default function TourismFields({ formData, setFormData }) {
  const { language } = useLang();
  const s = formData.specs_json || {};
  const tr = (key) => tourismText(language, key);
  const setSpec = (key, value) => setFormData((prev) => ({ ...prev, specs_json: { ...(prev.specs_json || {}), [key]: value } }));

  return (
    <section style={styles.wrap}>
      <div style={styles.head}>
        <div>
          <div style={styles.kicker}>CASA-CAR TOURISM</div>
          <h3 style={styles.title}>{tr('tourism_fields_title')}</h3>
        </div>
        <label style={styles.switch}>
          <input type="checkbox" checked={!!s.instant_book} onChange={(e) => setSpec('instant_book', e.target.checked)} />
          {tr('instant_book')}
        </label>
      </div>

      <div style={styles.grid}>
        <select style={styles.input} value={s.tourism_type || 'stay'} onChange={(e) => setSpec('tourism_type', e.target.value)}>
          <option value="stay">{tr('stay')}</option>
          <option value="experience">{tr('experience')}</option>
          <option value="rental">{tr('rental')}</option>
        </select>
        <input style={styles.input} type="number" min="1" value={s.capacity || ''} onChange={(e) => setSpec('capacity', e.target.value)} placeholder={tr('capacity')} />
        <input style={styles.input} type="number" min="1" value={s.min_nights || ''} onChange={(e) => setSpec('min_nights', e.target.value)} placeholder={tr('min_nights')} />
        <input style={styles.input} type="number" min="1" value={s.max_nights || ''} onChange={(e) => setSpec('max_nights', e.target.value)} placeholder={tr('max_nights')} />
      </div>

      <div style={styles.grid}>
        <input style={styles.input} value={s.checkin_from || ''} onChange={(e) => setSpec('checkin_from', e.target.value)} placeholder={tr('checkin_from')} />
        <input style={styles.input} value={s.checkout_until || ''} onChange={(e) => setSpec('checkout_until', e.target.value)} placeholder={tr('checkout_until')} />
        <input style={styles.input} type="number" min="0" value={s.bedrooms || ''} onChange={(e) => setSpec('bedrooms', e.target.value)} placeholder={tr('bedrooms')} />
        <input style={styles.input} type="number" min="0" value={s.bathrooms || ''} onChange={(e) => setSpec('bathrooms', e.target.value)} placeholder={tr('bathrooms')} />
      </div>

      <div style={styles.panel}>
        <strong>{tr('price_engine')}</strong>
        <div style={styles.grid}>
          <input style={styles.input} type="number" min="0" value={s.base_price_night || ''} onChange={(e) => setSpec('base_price_night', e.target.value)} placeholder={tr('base_night')} />
          <input style={styles.input} type="number" min="0" value={s.weekend_price || ''} onChange={(e) => setSpec('weekend_price', e.target.value)} placeholder={tr('weekend_night')} />
          <input style={styles.input} type="number" min="0" value={s.high_season_price || ''} onChange={(e) => setSpec('high_season_price', e.target.value)} placeholder={tr('high_season')} />
          <input style={styles.input} type="number" min="0" value={s.holiday_price || ''} onChange={(e) => setSpec('holiday_price', e.target.value)} placeholder={tr('holiday_price')} />
          <input style={styles.input} type="number" min="0" value={s.price_per_person || ''} onChange={(e) => setSpec('price_per_person', e.target.value)} placeholder={tr('price_person')} />
          <input style={styles.input} type="number" min="0" max="80" value={s.weekly_discount || ''} onChange={(e) => setSpec('weekly_discount', e.target.value)} placeholder={tr('weekly_discount')} />
        </div>
      </div>

      <div style={styles.panel}>
        <strong>{tr('availability')}</strong>
        <textarea style={styles.textarea} value={s.blocked_dates || ''} onChange={(e) => setSpec('blocked_dates', e.target.value)} placeholder={tr('blocked_dates_hint')} />
      </div>

      <div style={styles.panel}>
        <strong>{tr('amenities')}</strong>
        <div style={styles.checks}>
          {TOURISM_AMENITIES.map((key) => (
            <label key={key} style={styles.check}>
              <input type="checkbox" checked={!!s[key]} onChange={(e) => setSpec(key, e.target.checked)} />
              {tr(key)}
            </label>
          ))}
        </div>
      </div>

      {s.tourism_type === 'experience' ? (
        <div style={styles.panel}>
          <strong>{tr('experience')}</strong>
          <div style={styles.grid}>
            <select style={styles.input} value={s.experience_type || ''} onChange={(e) => setSpec('experience_type', e.target.value)}>
              <option value="">{tr('experience_type')}</option>
              {TOURISM_EXPERIENCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input style={styles.input} type="number" min="0" value={s.duration_hours || ''} onChange={(e) => setSpec('duration_hours', e.target.value)} placeholder={tr('duration_hours')} />
            <input style={styles.input} value={s.meeting_point || ''} onChange={(e) => setSpec('meeting_point', e.target.value)} placeholder={tr('meeting_point')} />
          </div>
          <textarea style={styles.textarea} value={s.included || ''} onChange={(e) => setSpec('included', e.target.value)} placeholder={tr('included')} />
        </div>
      ) : null}

      {s.tourism_type === 'rental' ? (
        <div style={styles.panel}>
          <strong>{tr('rental_options')}</strong>
          <div style={styles.checks}>
            {TOURISM_RENTAL_TYPES.map((type) => (
              <label key={type} style={styles.check}>
                <input
                  type="checkbox"
                  checked={String(s.rental_options || '').split(',').map((value) => value.trim()).includes(type)}
                  onChange={(e) => {
                    const current = String(s.rental_options || '').split(',').map((value) => value.trim()).filter(Boolean);
                    const next = e.target.checked ? [...new Set([...current, type])] : current.filter((value) => value !== type);
                    setSpec('rental_options', next.join(', '));
                  }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.grid}>
        <textarea style={styles.textarea} value={s.house_rules || ''} onChange={(e) => setSpec('house_rules', e.target.value)} placeholder={tr('house_rules')} />
        <textarea style={styles.textarea} value={s.cancellation_policy || ''} onChange={(e) => setSpec('cancellation_policy', e.target.value)} placeholder={tr('cancellation_policy')} />
      </div>
    </section>
  );
}

const styles = {
  wrap: { display: 'grid', gap: 14, padding: 18, border: '1px solid #dbeafe', borderRadius: 18, background: '#f8fbff', minWidth: 0, maxWidth: '100%', overflow: 'hidden' },
  head: { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' },
  kicker: { fontSize: 12, fontWeight: 900, letterSpacing: '.12em', color: '#1d4ed8' },
  title: { margin: '4px 0 0', fontSize: 21, color: '#111827' },
  switch: { display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #bfdbfe', background: '#fff', borderRadius: 999, padding: '9px 12px', fontWeight: 900, maxWidth: '100%', minWidth: 0 },
  panel: { display: 'grid', gap: 10, border: '1px solid #e5e7eb', background: '#fff', borderRadius: 16, padding: 14, minWidth: 0, overflow: 'hidden' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))', gap: 12, minWidth: 0 },
  input: { width: '100%', maxWidth: '100%', minWidth: 0, padding: '13px 14px', border: '1px solid #cbd5e1', borderRadius: 14, background: '#fff', fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', maxWidth: '100%', minWidth: 0, minHeight: 92, padding: '13px 14px', border: '1px solid #cbd5e1', borderRadius: 14, background: '#fff', resize: 'vertical', boxSizing: 'border-box' },
  checks: { display: 'flex', flexWrap: 'wrap', gap: 12, minWidth: 0 },
  check: { display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, color: '#334155', minWidth: 0, maxWidth: '100%' },
};
