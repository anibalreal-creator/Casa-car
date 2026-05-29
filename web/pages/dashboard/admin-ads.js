import { useEffect, useMemo, useState } from 'react'
import { secureFetch } from '../../lib/secureClient';
import GlobalHeader from '../../components/GlobalHeader';
import FooterBlueBar from '../../components/FooterBlueBar';
import { getSlotLabel } from '../../lib/adSlots';

const SLOT_LABELS = {
  home_top: 'Home superior',
  home_middle: 'Home media',
  search_sidebar: 'Buscar sidebar',
  listing_inline: 'Ficha de anuncio',
  footer_strip: 'Pie global',
};

function formatPlanLabel(item) {
  return item?.plan_name || item?.plan_key || '—';
}

function formatSlotLabel(item) {
  const key = String(item?.slot_key || item?.slot || '').trim();
  return item?.slot_label || getSlotLabel(key, '—');
}

function Stat({ label, value }) {
  return <div style={styles.stat}><span>{label}</span><strong>{value}</strong></div>;
}

function StatusPill({ status }) {
  const map = {
    active: { bg: '#dcfce7', fg: '#166534', label: 'active' },
    pending_payment: { bg: '#fef3c7', fg: '#92400e', label: 'pending_payment' },
    pending: { bg: '#fef3c7', fg: '#92400e', label: 'pending' },
    paused: { bg: '#e5e7eb', fg: '#374151', label: 'paused' },
    expired: { bg: '#fee2e2', fg: '#991b1b', label: 'expired' },
    scheduled: { bg: '#dbeafe', fg: '#1d4ed8', label: 'scheduled' },
  };
  const style = map[String(status || '').toLowerCase()] || { bg: '#eef2ff', fg: '#4338ca', label: status || 'draft' };
  return <span style={{ background: style.bg, color: style.fg, padding: '6px 10px', borderRadius: 999, fontWeight: 800, fontSize: 12 }}>{style.label}</span>;
}

export default function AdminAdsPage() {
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [summaryRes, campaignsRes] = await Promise.all([
        fetch('/api/ads/admin-summary', { method: 'POST', headers: { 'x-casa-request': '1' } }),
        fetch(`/api/secure/admin/campaigns?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`),
      ]);
      const summaryJson = await summaryRes.json().catch(() => ({}));
      const campaignsJson = await campaignsRes.json().catch(() => ({}));
      setSummary(summaryJson.summary || null);
      setCampaigns(Array.isArray(campaignsJson.campaigns) ? campaignsJson.campaigns : []);
    } catch {
      setSummary(null);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  const filtered = useMemo(() => {
    const text = String(search || '').trim().toLowerCase();
    if (!text) return campaigns;
    return campaigns.filter((item) => [item.title, item.company_name, item.contact_email].join(' ').toLowerCase().includes(text));
  }, [campaigns, search]);

  async function applyAction(id, action) {
    setBusyId(id + ':' + action);
    setNotice('');
    try {
      const res = await secureFetch('/api/secure/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'No se pudo actualizar la campaña');
      setNotice(`Campaña ${action === 'activate' ? 'activada' : action === 'pause' ? 'pausada' : 'vencida'} correctamente.`);
      await load();
    } catch (error) {
      setNotice(error.message || 'No se pudo actualizar la campaña');
    } finally {
      setBusyId('');
    }
  }

  async function syncCampaigns() {
    setSyncing(true);
    setNotice('');
    try {
      const res = await fetch('/api/secure/admin/sync-campaigns', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'No se pudo sincronizar');
      setNotice(`Sincronización OK · ${json.updated || 0} campañas actualizadas.`);
      await load();
    } catch (error) {
      setNotice(error.message || 'No se pudo sincronizar');
    } finally {
      setSyncing(false);
    }
  }

  const s = summary || {};

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <div style={styles.kicker}>ADMIN ADS</div>
        <div style={styles.heroRow}>
          <div>
            <h1 style={styles.title}>Admin Ads</h1>
            <p style={styles.subtitle}>Operación completa de campañas, estados y renovaciones.</p>
          </div>
          <div style={styles.heroActions}>
            <button type="button" style={styles.secondaryButton} onClick={load} disabled={loading}>{loading ? 'Recargando…' : 'Recargar'}</button>
            <button type="button" style={styles.secondaryButton} onClick={syncCampaigns} disabled={syncing}>{syncing ? 'Sincronizando…' : 'Sync estados'}</button>
          </div>
        </div>

        {notice ? <div style={styles.notice}>{notice}</div> : null}

        <section style={styles.stats}>
          <Stat label="Total" value={loading ? '…' : s.totalCampaigns || 0} />
          <Stat label="Activas" value={loading ? '…' : s.active || 0} />
          <Stat label="Pendientes" value={loading ? '…' : s.pending || 0} />
          <Stat label="Pausadas" value={loading ? '…' : s.paused || 0} />
          <Stat label="Vencidas" value={loading ? '…' : s.expired || 0} />
        </section>

        <section style={styles.filters}>
          <input style={styles.input} placeholder="Buscar por título, empresa o email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todos</option>
            <option value="active">active</option>
            <option value="pending_payment">pending_payment</option>
            <option value="paused">paused</option>
            <option value="expired">expired</option>
          </select>
          <a href="/dashboard/ad-stats" style={styles.ghostLink}>Ad Stats</a>
        </section>

        <section style={styles.card}>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Slot</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Inicio</th>
                  <th style={styles.th}>Fin</th>
                  <th style={styles.th}>Impresiones</th>
                  <th style={styles.th}>Clicks</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? filtered.map((item) => {
                  const isBusy = busyId.startsWith(item.id);
                  return (
                    <tr key={item.id}>
                      <td style={styles.td}>{item.title || 'Campaña'}</td>
                      <td style={styles.td}>{formatPlanLabel(item)}</td>
                      <td style={styles.td}>{formatSlotLabel(item)}</td>
                      <td style={styles.td}><StatusPill status={item.status} /></td>
                      <td style={styles.td}>{item.starts_at ? new Date(item.starts_at).toLocaleDateString('es-AR') : '—'}</td>
                      <td style={styles.td}>{item.ends_at ? new Date(item.ends_at).toLocaleDateString('es-AR') : '—'}</td>
                      <td style={styles.td}>{Number(item.impressions || 0)}</td>
                      <td style={styles.td}>{Number(item.clicks || 0)}</td>
                      <td style={styles.td}>{item.contact_email || '—'}</td>
                      <td style={styles.td}>
                        <div style={styles.actionWrap}>
                          <button type="button" style={styles.smallButton} disabled={isBusy} onClick={() => applyAction(item.id, 'activate')}>Activar</button>
                          <button type="button" style={styles.smallButtonAlt} disabled={isBusy} onClick={() => applyAction(item.id, 'pause')}>Pausar</button>
                          <button type="button" style={styles.smallDanger} disabled={isBusy} onClick={() => applyAction(item.id, 'expire')}>Vencer</button>
                          <button type="button" style={styles.smallRenew} disabled={isBusy} onClick={() => applyAction(item.id, 'activate')}>Renovar</button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td style={styles.td} colSpan="10">Todavía no hay campañas para mostrar.</td></tr>
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
  kicker: { display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontWeight: 900, fontSize: 12 },
  heroRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' },
  heroActions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  title: { fontSize: 42, margin: '8px 0 0 0' },
  subtitle: { margin: 0, color: '#64748b' },
  notice: { background: '#ecfeff', border: '1px solid #67e8f9', color: '#155e75', padding: 14, borderRadius: 14, fontWeight: 800 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 },
  stat: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 16, display: 'grid', gap: 8 },
  filters: { display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'center' },
  input: { padding: '14px 16px', border: '1px solid #d1d5db', borderRadius: 14, fontSize: 15, background: '#fff' },
  select: { padding: '14px 16px', border: '1px solid #d1d5db', borderRadius: 14, fontSize: 15, background: '#fff' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, padding: 20 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 10px', fontSize: 13, color: '#475569', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 10px', fontSize: 14, borderBottom: '1px solid #eef2f7', verticalAlign: 'top' },
  actionWrap: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  secondaryButton: { background: '#fff', color: '#111827', padding: '12px 16px', borderRadius: 12, fontWeight: 800, border: '1px solid #d1d5db', cursor: 'pointer' },
  ghostLink: { textDecoration: 'none', background: '#eef2ff', color: '#3730a3', padding: '12px 16px', borderRadius: 12, fontWeight: 800, border: '1px solid #c7d2fe' },
  smallButton: { background: '#111827', color: '#fff', border: '1px solid #111827', borderRadius: 10, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' },
  smallButtonAlt: { background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 10, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' },
  smallDanger: { background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 10, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' },
  smallRenew: { background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 10, padding: '8px 10px', fontWeight: 700, cursor: 'pointer' },
};
