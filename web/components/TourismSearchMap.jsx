import { useMemo } from "react";
import { useLang } from "../context/LanguageContext";
import { getAmenityLabels, tourismText } from "../lib/tourism";
import { getListingDetailHref } from "../lib/listingRoutes";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function TourismSearchMap({ items = [] }) {
  const { language } = useLang();
  const tr = (key) => tourismText(language, key);
  const withCoords = items
    .map((item) => ({ ...item, latNum: toNumber(item.lat), lngNum: toNumber(item.lng) }))
    .filter((item) => item.latNum !== null && item.lngNum !== null);
  const center = withCoords[0] || null;

  const src = useMemo(() => {
    if (!center) return "https://www.openstreetmap.org/export/embed.html?bbox=-82,-45,82,45&layer=mapnik";
    const size = 0.18;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${center.lngNum - size}%2C${center.latNum - size}%2C${center.lngNum + size}%2C${center.latNum + size}&layer=mapnik&marker=${center.latNum}%2C${center.lngNum}`;
  }, [center]);

  return (
    <aside style={styles.wrap}>
      <div style={styles.head}>
        <div>
          <div style={styles.kicker}>BOOKING MAP</div>
          <strong>{tr('map_title')}</strong>
        </div>
        <span style={styles.count}>{withCoords.length}/{items.length}</span>
      </div>
      <iframe title="tourism-map" src={src} style={styles.frame} loading="lazy" />
      <div style={styles.list}>
        {items.slice(0, 8).map((item) => {
          const amenities = getAmenityLabels(item, language).slice(0, 3);
          return (
            <a key={item.id} href={getListingDetailHref(item)} style={styles.item}>
              <strong>{item.title || 'Casa-Car'}</strong>
              <span>{[item.city, item.country].filter(Boolean).join(', ')}</span>
              <span>{item.currency || 'USD'} {Number(item.price || 0).toLocaleString('es-AR')}</span>
              {amenities.length ? <small>{amenities.join(' · ')}</small> : null}
            </a>
          );
        })}
      </div>
      {!withCoords.length ? <div style={styles.empty}>{tr('map_empty')}</div> : null}
    </aside>
  );
}

const styles = {
  wrap: { position: 'sticky', top: 88, alignSelf: 'start', display: 'grid', gap: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 14, boxShadow: '0 14px 32px rgba(15,23,42,.07)' },
  head: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  kicker: { fontSize: 11, fontWeight: 900, letterSpacing: '.12em', color: '#1d4ed8' },
  count: { border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '6px 9px', fontWeight: 900, fontSize: 12 },
  frame: { width: '100%', height: 310, border: 0, borderRadius: 14, background: '#eef2f7' },
  list: { display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto', paddingRight: 2 },
  item: { display: 'grid', gap: 4, textDecoration: 'none', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, background: '#f8fafc' },
  empty: { fontSize: 13, color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 10 },
};
