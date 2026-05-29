import { useLang } from "../context/LanguageContext";
import { getAmenityLabels, getTourismSpecs, tourismText } from "../lib/tourism";

export default function TourismProfileSection({ listing }) {
  const { language } = useLang();
  const tr = (key) => tourismText(language, key);
  const specs = getTourismSpecs(listing);
  const amenities = getAmenityLabels(listing, language);
  const blockedCount = String(specs.blocked_dates || '').split(',').map((x) => x.trim()).filter(Boolean).length;

  const priceRows = [
    [tr('base_night'), specs.base_price_night || listing.price],
    [tr('weekend_night'), specs.weekend_price],
    [tr('high_season'), specs.high_season_price],
    [tr('holiday_price'), specs.holiday_price],
    [tr('price_person'), specs.price_per_person],
    [tr('weekly_discount'), specs.weekly_discount ? `${specs.weekly_discount}%` : ''],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');

  const infoRows = [
    [tr('tourism_type'), specs.tourism_type ? tr(specs.tourism_type) : ''],
    [tr('capacity'), specs.capacity],
    [tr('min_nights'), specs.min_nights],
    [tr('max_nights'), specs.max_nights],
    [tr('checkin_from'), specs.checkin_from],
    [tr('checkout_until'), specs.checkout_until],
    [tr('blocked_dates'), blockedCount ? blockedCount : '0'],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');

  return (
    <section style={styles.card}>
      <div style={styles.head}>
        <div>
          <div style={styles.kicker}>TOURISM PRO</div>
          <h2 style={styles.title}>{tr('tourism_profile_title')}</h2>
        </div>
        <span style={styles.badge}>{specs.instant_book ? tr('instant_book') : tr('request_booking')}</span>
      </div>

      <div style={styles.grid}>
        <div style={styles.panel}>
          <strong>{tr('availability')}</strong>
          <div style={styles.rows}>
            {infoRows.map(([label, value]) => <Row key={label} label={label} value={value} />)}
          </div>
        </div>

        <div style={styles.panel}>
          <strong>{tr('price_engine')}</strong>
          <div style={styles.rows}>
            {priceRows.length ? priceRows.map(([label, value]) => <Row key={label} label={label} value={`${listing.currency || 'USD'} ${value}`} />) : <span style={styles.muted}>{tr('base_night')}: {listing.currency || 'USD'} {Number(listing.price || 0).toLocaleString('es-AR')}</span>}
          </div>
        </div>
      </div>

      {amenities.length ? (
        <div style={styles.panel}>
          <strong>{tr('amenities')}</strong>
          <div style={styles.amenities}>{amenities.map((label) => <span key={label} style={styles.chip}>{label}</span>)}</div>
        </div>
      ) : null}

      {specs.tourism_type === 'experience' || specs.experience_type || specs.included ? (
        <div style={styles.panel}>
          <strong>{tr('experience')}</strong>
          <div style={styles.rows}>
            {specs.experience_type ? <Row label={tr('experience_type')} value={specs.experience_type} /> : null}
            {specs.duration_hours ? <Row label={tr('duration_hours')} value={specs.duration_hours} /> : null}
            {specs.meeting_point ? <Row label={tr('meeting_point')} value={specs.meeting_point} /> : null}
            {specs.included ? <p style={styles.text}>{specs.included}</p> : null}
          </div>
        </div>
      ) : null}

      {specs.house_rules || specs.cancellation_policy ? (
        <div style={styles.grid}>
          {specs.house_rules ? <TextPanel title={tr('house_rules')} text={specs.house_rules} /> : null}
          {specs.cancellation_policy ? <TextPanel title={tr('cancellation_policy')} text={specs.cancellation_policy} /> : null}
        </div>
      ) : null}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span>{label}</span>
      <strong>{String(value)}</strong>
    </div>
  );
}

function TextPanel({ title, text }) {
  return (
    <div style={styles.panel}>
      <strong>{title}</strong>
      <p style={styles.text}>{text}</p>
    </div>
  );
}

const styles = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 20, boxShadow: '0 12px 28px rgba(15,23,42,.06)', display: 'grid', gap: 16 },
  head: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' },
  kicker: { fontSize: 12, fontWeight: 900, letterSpacing: '.12em', color: '#1d4ed8' },
  title: { margin: '4px 0 0', fontSize: 26, color: '#111827' },
  badge: { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '8px 11px', fontWeight: 900, fontSize: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 },
  panel: { border: '1px solid #e5e7eb', borderRadius: 16, background: '#f8fafc', padding: 14, display: 'grid', gap: 10 },
  rows: { display: 'grid', gap: 8 },
  row: { display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #e5e7eb', paddingBottom: 7, color: '#475569' },
  amenities: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { border: '1px solid #c7d2fe', background: '#eef2ff', color: '#3730a3', borderRadius: 999, padding: '7px 10px', fontWeight: 800, fontSize: 12 },
  muted: { color: '#64748b', fontWeight: 700 },
  text: { margin: 0, color: '#334155', lineHeight: 1.6 },
};
