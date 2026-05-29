import Link from 'next/link';
import GlobalHeader from '../../components/GlobalHeader';
import FooterBlueBar from '../../components/FooterBlueBar';
import AdSlot from '../../components/AdSlot';
import { AD_PLANS, AD_SLOTS } from '../../data/adPlans';
import { useLang } from '../../context/LanguageContext';

export default function PublicidadPage() {
  const { t, language } = useLang();

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <section style={styles.hero}>
          <div>
            <div style={styles.kicker}>CASA-CAR ADS</div>
            <h1 style={styles.title}>{t('ads_page_title', 'Vendé espacios publicitarios automáticos dentro de Casa-Car')}</h1>
            <p style={styles.subtitle}>{t('ads_page_subtitle', 'Elegí un plan, reservá un slot y mostrá tu banner en las ubicaciones más visibles del sitio.')}</p>
            <div style={styles.actions}>
              <Link href="/publicidad/panel" style={styles.primary}>{t('ads_create_campaign', 'Crear campaña')}</Link>
              <Link href="/panel-empresas" style={styles.secondary}>{t('nav_company_panel', 'Panel empresas')}</Link>
              <Link href="/dashboard/company" style={styles.secondary}>{t('nav_company_dashboard', 'Dashboard empresa')}</Link>
              <a href="#planes" style={styles.secondary}>{t('ads_view_plans', 'Ver planes')}</a>
            </div>
          </div>
          <div style={styles.sideCard}>
            <div style={styles.sideStat}><strong>5</strong><span>{t('ads_slots_ready', 'slots publicitarios listos')}</span></div>
            <div style={styles.sideStat}><strong>MP</strong><span>{t('ads_mp', 'cobro con Mercado Pago')}</span></div>
            <div style={styles.sideStat}><strong>Auto</strong><span>{t('ads_webhook', 'activación por webhook')}</span></div>
          </div>
        </section>

        <AdSlot slot="home_top" page="home" title={t('ads_example_main', 'Ejemplo de banner principal')} />

        <section id="planes" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>{t('ads_plans_kicker', 'PLANES DE PUBLICIDAD')}</div>
              <h2 style={styles.h2}>{t('ads_plans_title', 'Básico, Destacado y Premium')}</h2>
            </div>
            <Link href="/publicidad/panel" style={styles.linkCta}>{t('ads_create_campaign', 'Crear campaña')}</Link>
          </div>
          <div style={styles.planGrid}>
            {AD_PLANS.map((plan) => (
              <article key={plan.key} style={styles.planCard}>
                <div style={styles.badge}>{translatePlanBadge(plan.badge, t)}</div>
                <h3 style={styles.planName}>{translatePlanName(plan.name, t)}</h3>
                <div style={styles.price}>{plan.currency} {plan.price.toLocaleString(language === 'en' ? 'en-US' : 'es-AR')}</div>
                <p style={styles.planDesc}>{translatePlanDescription(plan.description, plan.key, t)}</p>
                <div style={styles.planMeta}>{t('ads_duration', 'Duración')}: {plan.durationDays} {t('ads_days', 'días')} · {translateImpressions(plan.impressions, t)}</div>
                <ul style={styles.featureList}>
                  {plan.features.map((feature) => <li key={feature}>{translateFeature(feature, t)}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>{t('ads_slots_kicker', 'SLOTS ACTIVOS')}</div>
              <h2 style={styles.h2}>{t('ads_slots_title', 'Banners estáticos y espacios reutilizables')}</h2>
            </div>
          </div>
          <div style={styles.slotGrid}>
            {AD_SLOTS.map((slot) => (
              <Link key={slot.key} href={`/publicidad/slots?slot=${slot.key}`} style={styles.slotCard}>
                <div style={styles.slotTitle}>{translateSlotLabel(slot.label, t)}</div>
                <div style={styles.slotMeta}>{slot.dimensions} · {t('ads_page_word', 'página')} {slot.page}</div>
                <p style={styles.slotText}>{t('ads_slot_cta', 'Tocá para ver una ubicación real de ejemplo dentro del sitio.')}</p>
              </Link>
            ))}
          </div>
        </section>

        <AdSlot slot="footer_strip" page="global" title={t('ads_example_footer', 'Ejemplo de pie patrocinado')} />
      </main>
      <FooterBlueBar />
    </div>
  );
}

function translatePlanBadge(value, t) {
  const map = {
    'Entrada': t('plan_badge_entry', 'Entrada'),
    'Más elegido': t('plan_badge_popular', 'Más elegido'),
    'Tipo MercadoLibre': t('plan_badge_mercado', 'Tipo MercadoLibre'),
  };
  return map[value] || value;
}

function translatePlanName(value, t) {
  const map = {
    'Básico': t('plan_basic', 'Básico'),
    'Destacado': t('plan_featured', 'Destacado'),
    'Premium': t('plan_premium', 'Premium'),
  };
  return map[value] || value;
}

function translatePlanDescription(value, key, t) {
  const map = {
    basico: t('plan_basic_desc', 'Ideal para empresas que quieren empezar a aparecer en Casa-Car con una inversión accesible.'),
    destacado: t('plan_featured_desc', 'Para marcas que necesitan presencia fuerte en home, resultados y fichas.'),
    premium: t('plan_premium_desc', 'Formato full visibility para marcas que quieren dominar la página como un sponsor principal.'),
  };
  return map[key] || value;
}

function translateImpressions(value, t) {
  const map = {
    'Rotación estándar': t('plan_impression_standard', 'Rotación estándar'),
    'Mayor visibilidad': t('plan_impression_higher', 'Mayor visibilidad'),
    'Máxima prioridad': t('plan_impression_max', 'Máxima prioridad'),
  };
  return map[value] || value;
}

function translateFeature(value, t) {
  const map = {
    '1 banner activo': t('feature_1_banner', '1 banner activo'),
    'Rotación en slots secundarios': t('feature_secondary_slots', 'Rotación en slots secundarios'),
    'Duración 7 días': `${t('ads_duration', 'Duración')} 7 ${t('ads_days', 'días')}`,
    'Link a sitio o WhatsApp': t('feature_link_site', 'Link a sitio o WhatsApp'),
    '2 slots simultáneos': t('feature_2_slots', '2 slots simultáneos'),
    'Prioridad frente a Básico': t('feature_priority_basic', 'Prioridad frente a Básico'),
    'Duración 15 días': `${t('ads_duration', 'Duración')} 15 ${t('ads_days', 'días')}`,
    'Métricas de campaña': t('feature_metrics', 'Métricas de campaña'),
    'Prioridad máxima': t('feature_priority_max', 'Prioridad máxima'),
    'Hasta 3 slots': t('feature_up_to_3', 'Hasta 3 slots'),
    'Duración 30 días': `${t('ads_duration', 'Duración')} 30 ${t('ads_days', 'días')}`,
    'Aparición destacada en página de publicidad': t('feature_appear_ads', 'Aparición destacada en página de publicidad'),
  };
  return map[value] || value;
}

function translateSlotLabel(value, t) {
  const map = {
    'Home superior': t('slot_home_top', 'Home superior'),
    'Home media': t('slot_home_middle', 'Home media'),
    'Buscar sidebar': t('slot_search_sidebar', 'Buscar sidebar'),
    'Ficha de anuncio': t('slot_listing_inline', 'Ficha de anuncio'),
    'Pie global': t('slot_footer', 'Pie global'),
  };
  return map[value] || value;
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg,#f8fbff 0%,#eef4ff 100%)', fontFamily: 'Arial, sans-serif' },
  wrap: { maxWidth: 1400, margin: '0 auto', padding: '28px 16px 50px', display: 'grid', gap: 26 },
  hero: { display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 22, background: '#fff', borderRadius: 28, border: '1px solid #dbeafe', padding: 28, boxShadow: '0 16px 40px rgba(15,23,42,.07)' },
  kicker: { display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontWeight: 900, fontSize: 12, letterSpacing: '.08em', marginBottom: 14 },
  title: { fontSize: 50, lineHeight: 1.02, margin: '0 0 14px 0', color: '#0f172a' },
  subtitle: { fontSize: 20, lineHeight: 1.65, color: '#475569', margin: 0, maxWidth: 840 },
  actions: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 },
  primary: { textDecoration: 'none', background: '#0f172a', color: '#fff', padding: '14px 18px', borderRadius: 14, fontWeight: 900 },
  secondary: { textDecoration: 'none', background: '#fff', color: '#0f172a', padding: '14px 18px', borderRadius: 14, fontWeight: 900, border: '1px solid #cbd5e1' },
  sideCard: { background: 'linear-gradient(135deg,#0f172a,#2563eb)', color: '#fff', borderRadius: 24, padding: 22, display: 'grid', gap: 14 },
  sideStat: { background: 'rgba(255,255,255,.12)', borderRadius: 18, padding: 16, display: 'grid', gap: 5 },
  section: { display: 'grid', gap: 18 },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 14, flexWrap: 'wrap' },
  sectionKicker: { fontSize: 12, color: '#2563eb', fontWeight: 900, letterSpacing: '.08em' },
  h2: { margin: '6px 0 0 0', fontSize: 34, color: '#0f172a' },
  linkCta: { textDecoration: 'none', color: '#0f172a', fontWeight: 900 },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 },
  planCard: { background: '#fff', border: '1px solid #dbeafe', borderRadius: 24, padding: 22, boxShadow: '0 14px 28px rgba(15,23,42,.06)' },
  badge: { display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: '#ede9fe', color: '#6d28d9', fontWeight: 900, fontSize: 12 },
  planName: { margin: '16px 0 8px 0', fontSize: 34, color: '#0f172a' },
  price: { fontSize: 24, fontWeight: 900, color: '#111827' },
  planDesc: { margin: '12px 0 10px 0', color: '#475569', fontSize: 17, lineHeight: 1.6 },
  planMeta: { color: '#0f172a', fontWeight: 800 },
  featureList: { margin: '12px 0 0 18px', padding: 0, display: 'grid', gap: 6, color: '#334155' },
  slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 },
  slotCard: { textDecoration: 'none', background: '#fff', border: '1px solid #dbeafe', borderRadius: 20, padding: 18, display: 'grid', gap: 8, boxShadow: '0 10px 24px rgba(15,23,42,.05)' },
  slotTitle: { color: '#0f172a', fontWeight: 900, fontSize: 18 },
  slotMeta: { color: '#2563eb', fontWeight: 800, fontSize: 14 },
  slotText: { margin: 0, color: '#64748b', lineHeight: 1.5 },
};
