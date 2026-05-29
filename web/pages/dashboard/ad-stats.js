import { useEffect, useMemo, useState } from 'react';
import GlobalHeader from '../../components/GlobalHeader';
import FooterBlueBar from '../../components/FooterBlueBar';
import { AD_PLANS } from '../../data/adPlans';
import { getSlotLabel } from '../../lib/adSlots';
import { secureFetch } from '../../lib/secureClient';

const PLAN_PRICE = AD_PLANS.reduce((acc, item) => {
  acc[String(item.key || '').toLowerCase()] = Number(item.price || 0);
  acc[String(item.name || '').toLowerCase()] = Number(item.price || 0);
  return acc;
}, {});

const SLOT_LABELS = {
  home_top: 'Home superior',
  home_middle: 'Home media',
  search_sidebar: 'Buscar sidebar',
  listing_inline: 'Ficha de anuncio',
  footer_strip: 'Pie global',
};

function resolvePlanPrice(item) {
  const keys = [item?.plan_key, item?.plan_name, item?.plan];
  for (const key of keys) {
    const normalized = String(key || '').trim().toLowerCase();
    if (normalized && PLAN_PRICE[normalized] != null) return Number(PLAN_PRICE[normalized] || 0);
  }
  return Number(item?.price || item?.plan_price || 0);
}

function resolvePlanLabel(item) {
  return item?.plan_name || item?.plan_key || item?.plan || '—';
}

function resolveSlotLabel(item) {
  const key = String(item?.slot_key || item?.slot || '').trim();
  return item?.slot_label || getSlotLabel(key, '—');
}

function money(value) {
  return `ARS ${Number(value || 0).toLocaleString('es-AR')}`;
}

function Metric({ label, value }) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </div>
  );
}

export default function AdStatsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const [summaryRes, campaignsRes] = await Promise.all([
        secureFetch('/api/ads/admin-summary', { method: 'POST', headers: { 'x-casa-request': '1' } }),
        fetch('/api/secure/admin/campaigns?status=all'),
      ]);
      const summaryJson = await summaryRes.json().catch(() => ({}));
      const campaignsJson = await campaignsRes.json().catch(() => ({}));
      const merged = Array.isArray(campaignsJson?.campaigns) && campaignsJson.campaigns.length
        ? campaignsJson.campaigns
        : Array.isArray(summaryJson?.campaigns)
          ? summaryJson.campaigns
          : [];
      setCampaigns(merged);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const impressions = campaigns.reduce((sum, item) => sum + Number(item.impressions || 0), 0);
    const clicks = campaigns.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const estimatedRevenue = campaigns.reduce((sum, item) => sum + resolvePlanPrice(item), 0);
    return { totalCampaigns, impressions, clicks, ctr, estimatedRevenue };
  }, [campaigns]);

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <div style={styles.topRow}>
          <div>
            <div style={styles.kicker}>ANALYTICS ADS</div>
            <h1 style={styles.title}>Ad Stats</h1>
            <p style={styles.subtitle}>Estadísticas publicitarias, CTR y estimación de ingresos por campaña.</p>
          </div>
          <div style={styles.actions}>
            <a href="/dashboard/admin-ads" style={styles.secondary}>Admin Ads</a>
            <button type="button" style={styles.primaryButton} onClick={load} disabled={loading}>{loading ? 'Recargando…' : 'Recargar'}</button>
          </div>
        </div>

        <section style={styles.metricsGrid}>
          <Metric label="Campañas" value={loading ? '…' : stats.totalCampaigns} />
          <Metric label="Impresiones" value={loading ? '…' : stats.impressions} />
          <Metric label="Clicks" value={loading ? '…' : stats.clicks} />
          <Metric label="CTR" value={loading ? '…' : `${stats.ctr}%`} />
          <Metric label="Ingreso estimado" value={loading ? '…' : money(stats.estimatedRevenue)} />
        </section>

        <section style={styles.tableCard}>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Slot</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Impresiones</th>
                  <th style={styles.th}>Clicks</th>
                  <th style={styles.th}>CTR</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Ingreso estimado</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length ? campaigns.map((item) => {
                  const price = resolvePlanPrice(item);
                  const impressions = Number(item.impressions || 0);
                  const clicks = Number(item.clicks || 0);
                  const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
                  return (
                    <tr key={item.id}>
                      <td style={styles.td}>{item.title || item.company_name || 'Campaña'}</td>
                      <td style={styles.td}>{resolvePlanLabel(item)}</td>
                      <td style={styles.td}>{resolveSlotLabel(item)}</td>
                      <td style={styles.td}>{item.status || 'draft'}</td>
                      <td style={styles.td}>{impressions}</td>
                      <td style={styles.td}>{clicks}</td>
                      <td style={styles.td}>{ctr}%</td>
                      <td style={styles.td}>{item.contact_email || '—'}</td>
                      <td style={styles.td}>{money(price)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td style={styles.td} colSpan="9">Todavía no hay campañas para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Arial, sans-serif' },
  wrap: { maxWidth: 1380, margin: '0 auto', padding: '28px 16px 48px', display: 'grid', gap: 18 },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' },
  kicker: { display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontWeight: 900, fontSize: 12 },
  title: { fontSize: 42, margin: '8px 0 0 0' },
  subtitle: { margin: 0, color: '#64748b' },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  secondary: { textDecoration: 'none', background: '#fff', color: '#111827', padding: '12px 16px', borderRadius: 12, fontWeight: 800, border: '1px solid #d1d5db' },
  primaryButton: { background: '#111827', color: '#fff', padding: '12px 16px', borderRadius: 12, fontWeight: 800, border: 'none', cursor: 'pointer' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 },
  metricCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 18, display: 'grid', gap: 8 },
  metricLabel: { color: '#64748b', fontWeight: 700 },
  metricValue: { fontSize: 24 },
  tableCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, padding: 20 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 10px', fontSize: 13, color: '#475569', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 10px', fontSize: 14, borderBottom: '1px solid #eef2f7', verticalAlign: 'top' },
};
