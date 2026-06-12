import Link from 'next/link';
import { useRouter } from 'next/router';
import GlobalHeader from '../../components/GlobalHeader';
import FooterBlueBar from '../../components/FooterBlueBar';
import { AD_SLOTS, getAdSlot } from '../../data/adPlans';
import { useLang } from '../../context/LanguageContext';

export default function PublicidadSlots() {
  const { t } = useLang();
  const router = useRouter();
  const selectedKey = String(router.query.slot || '');
  const selected = selectedKey ? getAdSlot(selectedKey) : null;

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <section style={styles.hero}>
          <div>
            <div style={styles.kicker}>UBICACIONES DE PUBLICIDAD</div>
            <h1 style={styles.title}>{t('ads_locations_title', 'Ubicaciones reales de slots')}</h1>
            <p style={styles.subtitle}>{t('ads_locations_subtitle', 'Cada slot te lleva a una vista de ejemplo para entender donde aparece el banner.')}</p>
          </div>
          {selected ? (
            <Link href={selected.examplePath} style={styles.primary}>
              Ver {selected.label}
            </Link>
          ) : (
            <Link href="/publicidad/panel" style={styles.primary}>Crear campania</Link>
          )}
        </section>

        <section style={styles.grid}>
          {AD_SLOTS.map((slot) => (
            <Link key={slot.key} href={slot.examplePath} style={{ ...styles.card, ...(selected?.key === slot.key ? styles.cardActive : null) }}>
              <div style={styles.cardTop}>
                <strong style={styles.cardTitle}>{slot.label}</strong>
                <span style={styles.badge}>{slot.page}</span>
              </div>
              <div style={styles.size}>{slot.dimensions}</div>
              <div style={styles.preview}>
                <div style={slot.key === 'search_sidebar' ? styles.previewSidebar : styles.previewWide} />
              </div>
              <span style={styles.linkText}>Ver ubicacion real</span>
            </Link>
          ))}
        </section>
      </main>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Arial, sans-serif' },
  wrap: { maxWidth: 1320, margin: '0 auto', padding: '28px 16px 48px', display: 'grid', gap: 18 },
  hero: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 24, padding: 22, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 16px 36px rgba(15,23,42,.06)' },
  kicker: { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '6px 10px', fontWeight: 900, fontSize: 12, letterSpacing: '.08em', marginBottom: 10 },
  title: { margin: 0, color: '#0f172a', fontSize: 'clamp(32px,4vw,48px)', lineHeight: 1.05 },
  subtitle: { margin: '10px 0 0 0', color: '#64748b', fontSize: 17, lineHeight: 1.45, maxWidth: 760 },
  primary: { textDecoration: 'none', background: '#0f172a', color: '#fff', borderRadius: 14, padding: '13px 16px', fontWeight: 900 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 },
  card: { textDecoration: 'none', color: '#0f172a', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 16, display: 'grid', gap: 12, boxShadow: '0 12px 28px rgba(15,23,42,.05)' },
  cardActive: { borderColor: '#1d4ed8', boxShadow: '0 0 0 3px rgba(29,78,216,.12)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 18 },
  badge: { background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 900 },
  size: { color: '#475569', fontWeight: 900 },
  preview: { height: 96, borderRadius: 14, border: '1px solid #dbeafe', background: '#f8fbff', display: 'grid', placeItems: 'center', overflow: 'hidden' },
  previewWide: { width: '86%', height: 34, borderRadius: 8, background: 'linear-gradient(90deg,#0f172a,#1d4ed8,#38bdf8)' },
  previewSidebar: { width: 74, height: 84, borderRadius: 10, background: 'linear-gradient(180deg,#0f172a,#1d4ed8)' },
  linkText: { color: '#1d4ed8', fontWeight: 900 },
};
