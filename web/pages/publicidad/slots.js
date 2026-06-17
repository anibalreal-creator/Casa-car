import Link from 'next/link';
import { useRouter } from 'next/router';
import GlobalHeader from '../../components/GlobalHeader';
import FooterBlueBar from '../../components/FooterBlueBar';
import AdSlot from '../../components/AdSlot';
import { AD_SLOTS, getAdSlot } from '../../data/adPlans';
import { useLang } from '../../context/LanguageContext';

function slotHref(slotKey) {
  return `/publicidad/slots?slot=${encodeURIComponent(slotKey || 'home_middle')}`;
}

export default function PublicidadSlots() {
  const { t } = useLang();
  const router = useRouter();
  const selectedKey = String(router.query.slot || '');
  const selected = selectedKey ? getAdSlot(selectedKey) : null;

  return (
    <div className="cc-slots-page" style={styles.page}>
      <GlobalHeader />
      <main className="cc-slots-wrap" style={styles.wrap}>
        <section className="cc-slots-hero" style={styles.hero}>
          <div>
            <div style={styles.kicker}>UBICACIONES DE PUBLICIDAD</div>
            <h1 style={styles.title}>{t('ads_locations_title', 'Ubicaciones reales de slots')}</h1>
            <p style={styles.subtitle}>{t('ads_locations_subtitle', 'Cada slot te lleva a una vista de ejemplo para entender donde aparece el banner.')}</p>
          </div>
          {selected ? (
            <Link href={slotHref(selected.key)} style={styles.primary}>
              Ver {selected.label}
            </Link>
          ) : (
            <Link href="/publicidad/panel" style={styles.primary}>Crear campania</Link>
          )}
        </section>

        {selected ? (
          <section className="cc-slots-demo" style={styles.demo}>
            <div style={styles.demoCopy}>
              <div style={styles.kicker}>VISTA DEL SLOT ELEGIDO</div>
              <h2 style={styles.demoTitle}>{selected.label}</h2>
              <p style={styles.demoText}>Formato {selected.dimensions}. Esta vista muestra como queda el espacio dentro de una pagina real de Casa-Car.</p>
            </div>
            <div className="cc-slots-mock-page" style={styles.mockPage}>
              {selected.key === 'search_sidebar' ? (
                <div className="cc-slots-mock-search" style={styles.mockSearch}>
                  <aside style={styles.mockSearchRail}>
                    <div style={styles.mockFilter}>Filtros de busqueda</div>
                    <div style={styles.mockSideAd}><AdSlot slot="search_sidebar" page="buscar" title="Publicidad en resultados" compact /></div>
                  </aside>
                  <div style={styles.mockResults}>
                    <div style={styles.resultCard} />
                    <div style={styles.resultCard} />
                    <div style={styles.resultCard} />
                    <div style={styles.resultCard} />
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.mockHeader}>Contenido Casa-Car</div>
                  <AdSlot slot={selected.key} page={selected.page} title={selected.label} />
                  <div style={styles.mockCards}>
                    <div style={styles.resultCard} />
                    <div style={styles.resultCard} />
                    <div style={styles.resultCard} />
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}

        <section className="cc-slots-grid" style={styles.grid}>
          {AD_SLOTS.map((slot) => (
            <Link key={slot.key} href={slotHref(slot.key)} style={{ ...styles.card, ...(selected?.key === slot.key ? styles.cardActive : null) }}>
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
      <style jsx>{`
        .cc-slots-page,
        .cc-slots-wrap,
        .cc-slots-hero,
        .cc-slots-demo,
        .cc-slots-mock-page,
        .cc-slots-mock-search,
        .cc-slots-grid {
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
        }

        @media (max-width: 760px) {
          .cc-slots-wrap {
            width: 100% !important;
            padding: 18px 10px 96px !important;
          }
          .cc-slots-hero,
          .cc-slots-demo {
            padding: 16px !important;
            border-radius: 20px !important;
          }
          .cc-slots-hero :global(a) {
            width: 100%;
            text-align: center;
          }
          .cc-slots-mock-search,
          .cc-slots-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' },
  wrap: { width: '100%', maxWidth: 1320, margin: '0 auto', padding: '28px 16px 48px', display: 'grid', gap: 18, boxSizing: 'border-box' },
  hero: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 24, padding: 22, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 16px 36px rgba(15,23,42,.06)' },
  kicker: { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '6px 10px', fontWeight: 900, fontSize: 12, letterSpacing: '.08em', marginBottom: 10 },
  title: { margin: 0, color: '#0f172a', fontSize: 'clamp(32px,4vw,48px)', lineHeight: 1.05 },
  subtitle: { margin: '10px 0 0 0', color: '#64748b', fontSize: 17, lineHeight: 1.45, maxWidth: 760 },
  primary: { textDecoration: 'none', background: '#0f172a', color: '#fff', borderRadius: 14, padding: '13px 16px', fontWeight: 900 },
  demo: { display: 'grid', gap: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 24, padding: 20, boxShadow: '0 16px 36px rgba(15,23,42,.06)' },
  demoCopy: { display: 'grid', gap: 8 },
  demoTitle: { margin: 0, color: '#0f172a', fontSize: 30 },
  demoText: { margin: 0, color: '#64748b', fontSize: 16, lineHeight: 1.5 },
  mockPage: { display: 'grid', gap: 14, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 18, padding: 14, minWidth: 0, maxWidth: '100%', overflow: 'hidden' },
  mockHeader: { height: 64, borderRadius: 14, background: 'linear-gradient(90deg,#e2e8f0,#fff)', display: 'grid', placeItems: 'center', fontWeight: 900, color: '#475569' },
  mockCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 12 },
  mockSearch: { display: 'grid', gridTemplateColumns: 'minmax(0,320px) minmax(0,1fr)', gap: 14, alignItems: 'start' },
  mockSearchRail: { display: 'grid', gap: 14, minWidth: 0 },
  mockFilter: { minHeight: 260, borderRadius: 16, background: '#fff', border: '1px solid #e5e7eb', display: 'grid', placeItems: 'center', fontWeight: 900, color: '#64748b' },
  mockSideAd: { minWidth: 0 },
  mockResults: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 12 },
  resultCard: { minHeight: 150, borderRadius: 16, background: '#fff', border: '1px solid #e5e7eb' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 14 },
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
