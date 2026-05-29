import { useEffect, useMemo, useState } from 'react';
import GlobalHeader from '../../components/GlobalHeader';
import FooterBlueBar from '../../components/FooterBlueBar';
import { supabaseBrowser } from '../../lib/supabaseBrowser';
import { secureFetch } from '../../lib/secureClient';
import { getAdPlan } from '../../data/adPlans';
import { isOwnerEmail, ownerMembership } from '../../lib/owner';
import { useLang } from '../../context/LanguageContext';

function slotLocationHref(slotKey) {
  return `/publicidad/slots?slot=${encodeURIComponent(slotKey || 'home_middle')}`;
}

function formatSlotLabel(slotKey, fallbackLabel, t) {
  if (fallbackLabel) return fallbackLabel;
  const map = {
    home_top: t('slot_home_top', 'Home superior'),
    home_middle: t('slot_home_middle', 'Home media'),
    search_sidebar: t('slot_search_sidebar', 'Buscar sidebar'),
    listing_inline: t('slot_listing_inline', 'Ficha de anuncio'),
    footer_strip: t('slot_footer', 'Pie global'),
  };
  return map[String(slotKey || '').trim()] || slotKey || '-';
}

function formatPlanName(planKey, fallback, t) {
  const key = String(planKey || fallback || '').toLowerCase();
  if (key === 'basico' || key === 'basic') return t('plan_basic', 'Basico');
  if (key === 'destacado' || key === 'featured') return t('plan_featured', 'Destacado');
  if (key === 'premium') return t('plan_premium', 'Premium');
  return fallback || planKey || t('untitled', 'Sin titulo');
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function resolvePlanLimits(planKey) {
  switch (String(planKey || '').toLowerCase()) {
    case 'premium':
      return { campaigns: 30, actives: 10 };
    case 'destacado':
      return { campaigns: 10, actives: 4 };
    case 'basico':
    case 'basic':
    default:
      return { campaigns: 3, actives: 1 };
  }
}

export default function CompanyDashboardPage() {
  const { t } = useLang();
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  async function load(nextUserOverride = null) {
    setLoading(true);
    try {
      const sessionRes = await supabaseBrowser.auth.getSession();
      const nextUser = nextUserOverride || sessionRes?.data?.session?.user || null;
      setUser(nextUser);
      if (!nextUser) {
        setCampaigns([]);
        setDashboard(null);
        return;
      }
      const [campaignsRes, dashboardRes] = await Promise.all([
        fetch('/api/ads/my-campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-casa-request': '1',
            ...(sessionRes?.data?.session?.access_token ? { Authorization: `Bearer ${sessionRes.data.session.access_token}` } : {}),
          },
          body: JSON.stringify({ user_id: nextUser.id, contact_email: nextUser.email || '' }),
        }),
        secureFetch('/api/secure/company/dashboard').catch(() => null),
      ]);
      const payload = await campaignsRes.json().catch(() => ({}));
      const dashboardPayload = dashboardRes ? await dashboardRes.json().catch(() => null) : null;
      setCampaigns(Array.isArray(payload?.campaigns) ? payload.campaigns : []);
      setDashboard(dashboardPayload || null);
    } catch {
      setCampaigns([]);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      load(session?.user || null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((x) => x.active || x.status === 'active').length;
    const pending = campaigns.filter((x) => String(x.status || '').includes('pending')).length;
    const clicks = campaigns.reduce((acc, item) => acc + Number(item.clicks || 0), 0);
    const impressions = campaigns.reduce((acc, item) => acc + Number(item.impressions || 0), 0);
    return { total, active, pending, clicks, impressions };
  }, [campaigns]);

  const membership = user?.email && isOwnerEmail(user.email) ? ownerMembership() : (dashboard?.membership || { plan: null, active: false });
  const resolvedPlanKey = String(membership?.plan || membership?.plan_key || '').toLowerCase();
  const hasActivePlan = Boolean(membership?.active && resolvedPlanKey);
  const ownerMode = Boolean(user?.email && isOwnerEmail(user.email));
  const plan = hasActivePlan ? getAdPlan(resolvedPlanKey) : null;
  const planLimits = hasActivePlan ? resolvePlanLimits(plan?.key || resolvedPlanKey) : null;

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <div style={styles.kicker}>{t('dashboard_company_kicker', 'EMPRESAS')}</div>
        <h1 style={styles.title}>{t('dashboard_company_title', 'Dashboard empresa')}</h1>
        <p style={styles.subtitle}>{t('dashboard_company_subtitle', 'Control rapido para campanas, banners, cobros y slots publicitarios.')}</p>

        {!user ? <div style={styles.notice}>{t('signin_notice_campaigns', 'Inicia sesion para ver tus campanas publicitarias.')}</div> : null}

        <section style={styles.statsGrid}>
          <StatCard label={t('campaigns', 'Campanas')} value={loading ? '...' : stats.total} />
          <StatCard label={t('active_ads', 'Activas')} value={loading ? '...' : stats.active} />
          <StatCard label={t('pending', 'Pendientes')} value={loading ? '...' : stats.pending} />
          <StatCard label="Clicks" value={loading ? '...' : stats.clicks} />
          <StatCard label={t('impressions', 'Impresiones')} value={loading ? '...' : stats.impressions} />
        </section>

        <section style={styles.card}>
          <div style={styles.cardHead}>
            <div>
              <h2 style={styles.h2}>{t('plan_limits', 'Plan y limites')}</h2>
              <p style={styles.help}>{t('quota_help', 'Control de cupos para campanas y activaciones segun tu plan actual.')}</p>
            </div>
            <div style={styles.planPill}>{hasActivePlan ? `${t('plan', 'Plan')} ${formatPlanName(resolvedPlanKey, plan?.name, t)}` : t('no_active_plan_short', 'Sin plan activo')}</div>
          </div>
          <div style={styles.planGrid}>
            <StatCard label={t('campaigns_used', 'Campanas usadas')} value={loading ? '...' : hasActivePlan ? `${stats.total} / ${planLimits.campaigns}` : '-'} />
            <StatCard label={t('active_used', 'Activas usadas')} value={loading ? '...' : hasActivePlan ? `${stats.active} / ${planLimits.actives}` : '-'} />
            <StatCard label={t('listings', 'Listings')} value={loading ? '...' : (dashboard?.metrics?.premiumListings ?? 0)} />
            <StatCard label={t('can_create', 'Puede crear')} value={loading ? '...' : (hasActivePlan || ownerMode) ? t('yes', 'Si') : t('no', 'No')} />
          </div>
          {!loading && !hasActivePlan ? (
            <div style={styles.planNotice}>{t('no_active_plan', 'No hay un plan publicitario activo para esta cuenta. Podes contratar uno desde Ver panel empresas o Crear campana.')}</div>
          ) : null}
        </section>

        <section style={styles.card}>
          <div style={styles.cardHead}>
            <div>
              <h2 style={styles.h2}>{t('recent_campaigns', 'Campanas recientes')}</h2>
              <p style={styles.help}>{t('recent_campaigns_help', 'Renova campanas vencidas, revisa metricas y abri la ubicacion de cada slot.')}</p>
            </div>
            <div style={styles.actions}>
              <a href="/publicidad/panel" style={styles.primary}>{t('ads_create_campaign', 'Crear campana')}</a>
              <a href="/panel-empresas" style={styles.secondary}>{t('nav_company_panel', 'Panel empresas')}</a>
              <a href="/dashboard/ad-stats" style={styles.secondary}>Ad Stats</a>
            </div>
          </div>
          {campaigns.length ? (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>{t('title_label', 'Titulo')}</th>
                    <th>{t('plan', 'Plan')}</th>
                    <th>{t('slot', 'Slot')}</th>
                    <th>{t('status', 'Estado')}</th>
                    <th>{t('start_date', 'Inicio')}</th>
                    <th>{t('end_date', 'Fin')}</th>
                    <th>Clicks</th>
                    <th>{t('action_label', 'Accion')}</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title || t('untitled', 'Sin titulo')}</td>
                      <td>{formatPlanName(item.plan_key, item.plan_name, t)}</td>
                      <td>{formatSlotLabel(item.slot_key, item.slot_label, t)}</td>
                      <td>{item.status}{item.active ? ` · ${t('active_female', 'activa')}` : ''}</td>
                      <td>{item.starts_at ? new Date(item.starts_at).toLocaleDateString('es-AR') : '-'}</td>
                      <td>{item.ends_at ? new Date(item.ends_at).toLocaleDateString('es-AR') : '-'}</td>
                      <td>{Number(item.clicks || 0)}</td>
                      <td>
                        <div style={styles.actionLinks}>
                          <a href={`/publicidad/panel?edit=${item.id}`} style={styles.inlineLink}>{t('change_banner', 'Cambiar banner')}</a>
                          {item.banner_url ? <a href={item.banner_url} target="_blank" rel="noreferrer" style={styles.inlineLink}>{t('view_banner', 'Ver banner')}</a> : null}
                          <a href={slotLocationHref(item.slot_key)} style={styles.inlineLink}>{t('view_location', 'Ver ubicacion')}</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div style={styles.empty}>{t('no_company_campaigns', 'Todavia no hay campanas para esta cuenta.')}</div>}
        </section>
      </main>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Arial, sans-serif' },
  wrap: { maxWidth: 1280, margin: '0 auto', padding: '28px 16px 48px', display: 'grid', gap: 18 },
  kicker: { display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontWeight: 900, fontSize: 12 },
  title: { fontSize: 44, margin: '8px 0 0 0' },
  subtitle: { margin: 0, color: '#64748b', fontSize: 18 },
  notice: { background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', padding: 16, borderRadius: 16, fontWeight: 800 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginTop: 16 },
  statCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 18, display: 'grid', gap: 8 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, padding: 20 },
  cardHead: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  h2: { margin: '0 0 4px 0', fontSize: 28 },
  help: { margin: 0, color: '#64748b' },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  primary: { textDecoration: 'none', background: '#111827', color: '#fff', padding: '12px 16px', borderRadius: 12, fontWeight: 800 },
  secondary: { textDecoration: 'none', background: '#fff', color: '#111827', padding: '12px 16px', borderRadius: 12, fontWeight: 800, border: '1px solid #d1d5db' },
  planPill: { padding: '10px 14px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 900 },
  planNotice: { marginTop: 14, padding: '12px 14px', borderRadius: 14, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 },
  tableWrap: { overflowX: 'auto', marginTop: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  actionLinks: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  inlineLink: { color: '#4f46e5', fontWeight: 800, textDecoration: 'none' },
  empty: { padding: '16px 0', color: '#64748b', fontWeight: 700 },
};
