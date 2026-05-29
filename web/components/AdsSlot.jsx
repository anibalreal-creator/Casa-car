import { useLang } from '../context/LanguageContext';

export default function AdsSlot({
  slot = 'home_top',
  title,
  subtitle,
}) {
  const { t } = useLang();
  const isMiddle = slot === 'home_middle';
  const isListing = slot === 'listing_inline';

  const safeTitle = title || t('ads_bottom_title', 'Espacios publicitarios automáticos');
  const safeSubtitle = subtitle || t('ads_bottom_subtitle', 'Panel de empresas + cobro + visibilidad en slots reutilizables.');

  return (
    <section style={styles.section}>
      <div style={styles.wrap}>
        <div style={styles.head}>
          <span style={styles.kicker}>{t('ads_example_main', 'Ejemplo de banner principal')}</span>
          <a href="/publicidad/panel" style={styles.reserve}>{t('ads_reserve_space', 'Reservar este espacio')}</a>
        </div>

        <div style={styles.visualArea}>
          <div style={styles.visualGradient}>
            <div style={styles.visualLeft}>
              <span style={styles.planPill}>{isListing ? t('ads_sponsor', 'SPONSOR') : t('ads_premium_badge', 'PREMIUM')}</span>
              <h3 style={styles.visualTitle}>{t('ads_visual_title', 'Tu empresa puede aparecer acá')}</h3>
              <p style={styles.visualText}>Casa-Car Ads</p>
              <p style={styles.visualMeta}>{isMiddle ? t('ads_visual_meta_reusable', 'Panel de empresas + cobro + visibilidad en slots reutilizables.') : t('ads_visual_meta_mp', 'Cobro con Mercado Pago + activación automática por webhook.')}</p>
            </div>
            <div style={styles.visualRight}>
              <div style={styles.infoChip}><strong>{t('ads_plans', 'Planes')}</strong><span>{t('ads_plans_values', 'Básico · Destacado · Premium')}</span></div>
              <div style={styles.infoChip}><strong>{t('ads_slots', 'Slots')}</strong><span>{t('ads_slots_values', 'Home · Sidebar · Ficha')}</span></div>
              <div style={styles.infoChip}><strong>{t('ads_charge', 'Cobro')}</strong><span>{t('ads_charge_values', 'Mercado Pago + activación')}</span></div>
            </div>
          </div>
        </div>

        <div style={styles.bottom}>
          <div>
            <div style={styles.bottomTitle}>{safeTitle}</div>
            <div style={styles.bottomText}>{safeSubtitle}</div>
          </div>
          <div style={styles.actions}>
            <a href="/planes" style={styles.secondaryBtn}>{t('ads_view_plans', 'Ver planes')}</a>
            <a href="/publicidad/panel" style={styles.primaryBtn}>{t('ads_create_campaign', 'Crear campaña')}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: { marginTop: 12 }, wrap: { borderRadius: 24, overflow: 'hidden', border: '1px solid #dbe3f0', boxShadow: '0 14px 30px rgba(15,23,42,.06)', background: '#fff' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #eef2ff', background: '#f8fbff', flexWrap: 'wrap' },
  kicker: { fontSize: 12, fontWeight: 900, color: '#4f46e5', letterSpacing: '.06em' }, reserve: { textDecoration: 'none', color: '#111827', fontWeight: 800, fontSize: 13 },
  visualArea: { background: '#0b1022' },
  visualGradient: { minHeight: 210, display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18, padding: '22px 24px', color: '#fff', background: 'radial-gradient(circle at 80% 30%, rgba(96,165,250,.35), transparent 25%), linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)' },
  visualLeft: { display: 'grid', alignContent: 'center', gap: 10 }, visualRight: { display: 'grid', alignContent: 'center', gap: 12 },
  planPill: { display: 'inline-block', width: 'fit-content', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.92)', color: '#111827', fontWeight: 900, fontSize: 12 },
  visualTitle: { margin: 0, fontSize: 42, lineHeight: 1, letterSpacing: '-.04em' }, visualText: { margin: 0, fontWeight: 800, color: 'rgba(255,255,255,.9)' }, visualMeta: { margin: 0, color: 'rgba(255,255,255,.82)', lineHeight: 1.55, maxWidth: 520 },
  infoChip: { background: 'rgba(15,23,42,.38)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 18, padding: '14px 16px', display: 'grid', gap: 4 },
  bottom: { padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }, bottomTitle: { fontSize: 18, fontWeight: 900, color: '#111827' }, bottomText: { marginTop: 6, color: '#6b7280', lineHeight: 1.5, maxWidth: 780 }, actions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  primaryBtn: { textDecoration: 'none', background: '#111827', color: '#fff', padding: '11px 15px', borderRadius: 12, fontWeight: 900 },
  secondaryBtn: { textDecoration: 'none', background: '#fff', color: '#111827', padding: '11px 15px', borderRadius: 12, fontWeight: 900, border: '1px solid #d1d5db' },
};
