import { useEffect, useState } from "react";
import GlobalHeader from "../../components/GlobalHeader";
import FooterBlueBar from "../../components/FooterBlueBar";
import { supabaseBrowser } from "../../lib/supabaseBrowser";

function formatDay(day) {
  if (!day) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(day))) {
    const [year, month, date] = String(day).split('-');
    return `${date}/${month}/${year}`;
  }
  const parsed = new Date(day);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsed);
  }
  const [year, month, date] = String(day).split('-');
  return `${date}/${month}/${year}`;
}

function formatMonth(month) {
  if (!month) return '-';
  const [year, value] = String(month).split('-');
  return `${value}/${year}`;
}

function MetricsTable({ title, rows, type = 'day', columns }) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.h2}>{title}</h2>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{type === 'month' ? 'Mes' : 'Dia'}</th>
              {columns.map((column) => (
                <th key={column.key} style={styles.th}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows || []).slice().reverse().map((row) => (
              <tr key={row.day || row.month}>
                <td style={styles.td}>{type === 'month' ? formatMonth(row.month) : formatDay(row.day)}</td>
                {columns.map((column) => (
                  <td key={column.key} style={styles.tdStrong}>{row[column.key] ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentAccounts({ rows }) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.h2}>Ultimas cuentas creadas</h2>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Alta</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Metodo</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((account) => (
              <tr key={account.id}>
                <td style={styles.td}>{account.email || '-'}</td>
                <td style={styles.td}>{formatDay(account.created_at)}</td>
                <td style={styles.td}>
                  <span style={account.confirmed ? styles.goodPill : styles.warnPill}>
                    {account.confirmed ? 'Verificada' : 'Sin verificar'}
                  </span>
                </td>
                <td style={styles.td}>{account.provider || 'email'}</td>
              </tr>
            ))}
            {!rows?.length ? (
              <tr>
                <td style={styles.td} colSpan={4}>Todavia no hay cuentas para mostrar.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function SaasDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const token = sessionData?.session?.access_token || '';
        const res = await fetch('/api/secure/saas-overview', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error(json?.error || 'No se pudo cargar el dashboard SaaS');
        setData(json);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'No se pudo cargar el dashboard SaaS');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const ownerAnalytics = data?.ownerAnalytics || {};
  const registrations = ownerAnalytics.registrations || {};
  const visits = ownerAnalytics.visits || {};
  const searches = ownerAnalytics.searches || {};
  const logins = registrations.logins || data?.ownerAnalytics?.customerLogins || {};
  const cards = [
    { label: 'Clientes nuevos hoy', value: registrations.today ?? '-' },
    { label: 'Clientes nuevos semana', value: registrations.last7Days ?? '-' },
    { label: 'Clientes nuevos mes', value: registrations.thisMonth ?? '-' },
    { label: 'Cuentas registradas', value: registrations.total ?? '-' },
    { label: 'Cuentas sin verificar', value: registrations.unconfirmed ?? '-' },
    { label: 'Ingresos clientes hoy', value: logins.today ?? '-' },
    { label: 'Visitantes unicos hoy', value: ownerAnalytics.dailyUniqueVisitors ?? '-' },
    { label: 'Visitantes unicos semana', value: ownerAnalytics.weeklyUniqueVisitors ?? '-' },
    { label: 'Visitantes unicos mes', value: ownerAnalytics.monthlyUniqueVisitors ?? '-' },
    { label: 'Busquedas pedidas hoy', value: searches.today?.attempts ?? 0 },
    { label: 'Busquedas de usuarios hoy', value: searches.today?.completed ?? 0 },
    { label: 'Busquedas pedidas mes', value: searches.last30Days?.attempts ?? 0 },
    { label: 'Usuarios online ahora', value: ownerAnalytics.onlineNow ?? '-' },
    { label: 'Campañas activas', value: data?.campaigns?.active ?? 0 },
    { label: 'Publicaciones activas', value: data?.listings?.active ?? 0 },
  ];

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <div style={styles.kicker}>PANEL DUEÑO</div>
        <h1 style={styles.title}>Clientes y visitas</h1>
        <p style={styles.subtitle}>Solo para la cuenta dueña. Aca ves cuentas creadas, ingresos de clientes, visitas diarias y actividad general de Casa-Car.</p>
        {error ? <div style={styles.error}>{error}</div> : null}
        <section style={styles.grid}>
          {cards.map((card) => (
            <article key={card.label} style={styles.card}>
              <div style={styles.cardLabel}>{card.label}</div>
              <div style={styles.cardValue}>{card.value}</div>
            </article>
          ))}
        </section>

        <section style={styles.twoCol}>
          <RecentAccounts rows={registrations.recent || []} />
          <MetricsTable
            title="Cuentas creadas por dia"
            rows={registrations.dailyLast30 || []}
            columns={[{ key: 'count', label: 'Cuentas nuevas' }]}
          />
        </section>

        <section style={styles.twoCol}>
          <MetricsTable
            title="Busquedas por dia"
            rows={searches.dailyLast30 || []}
            columns={[
              { key: 'attempts', label: 'Pidieron registrarse' },
              { key: 'completed', label: 'Usuarios registrados' },
            ]}
          />
          <MetricsTable
            title="Visitas por dia"
            rows={visits.dailyLast30 || []}
            columns={[
              { key: 'visitors', label: 'Visitantes' },
              { key: 'users', label: 'Usuarios logueados' },
            ]}
          />
          <MetricsTable
            title="Cuentas creadas por mes"
            rows={registrations.monthlyLast12 || []}
            type="month"
            columns={[{ key: 'count', label: 'Cuentas nuevas' }]}
          />
        </section>

        <section style={styles.twoCol}>
          <div style={styles.panel}>
            <h2 style={styles.h2}>Suscripciones</h2>
            <ul style={styles.list}>
              <li>Activas: <strong>{data?.subscriptions?.active ?? 0}</strong></li>
              <li>Expiradas: <strong>{data?.subscriptions?.expired ?? 0}</strong></li>
              <li>Canceladas: <strong>{data?.subscriptions?.canceled ?? 0}</strong></li>
            </ul>
          </div>
          <div style={styles.panel}>
            <h2 style={styles.h2}>Campañas</h2>
            <ul style={styles.list}>
              <li>Activas: <strong>{data?.campaigns?.active ?? 0}</strong></li>
              <li>Pausadas: <strong>{data?.campaigns?.paused ?? 0}</strong></li>
              <li>Expiradas: <strong>{data?.campaigns?.expired ?? 0}</strong></li>
              <li>Impresiones: <strong>{data?.campaigns?.impressions ?? 0}</strong></li>
              <li>Clicks: <strong>{data?.campaigns?.clicks ?? 0}</strong></li>
            </ul>
          </div>
          <MetricsTable
            title="Visitas por mes"
            rows={visits.monthlyLast12 || []}
            type="month"
            columns={[
              { key: 'visitors', label: 'Visitantes' },
              { key: 'users', label: 'Usuarios logueados' },
            ]}
          />
        </section>
      </main>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:'#f5f7fb',minHeight:'100vh',fontFamily:'Arial, sans-serif'},
  wrap:{maxWidth:1280,margin:'0 auto',padding:'28px 16px 48px'},
  kicker:{display:'inline-block',padding:'6px 10px',borderRadius:999,background:'#ede9fe',color:'#6d28d9',fontWeight:800,fontSize:12,letterSpacing:'.08em'},
  title:{fontSize:'clamp(32px, 6vw, 46px)',margin:'12px 0 8px 0',lineHeight:1.05},
  subtitle:{margin:'0 0 20px 0',fontSize:18,color:'#64748b',maxWidth:880},
  error:{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b',padding:16,borderRadius:16,marginBottom:18,fontWeight:700},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:22},
  card:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:18,boxShadow:'0 12px 30px rgba(15,23,42,.05)'},
  cardLabel:{fontSize:13,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'.06em'},
  cardValue:{fontSize:34,fontWeight:900,color:'#0f172a',marginTop:8},
  twoCol:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,420px),1fr))',gap:18,marginBottom:18},
  panel:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:20,boxShadow:'0 12px 30px rgba(15,23,42,.05)'},
  h2:{margin:'0 0 12px 0',fontSize:22},
  list:{margin:0,paddingLeft:18,color:'#334155',display:'grid',gap:8},
  tableWrap:{overflowX:'auto',border:'1px solid #eef2f7',borderRadius:14},
  table:{width:'100%',borderCollapse:'collapse',minWidth:420},
  th:{textAlign:'left',fontSize:12,textTransform:'uppercase',letterSpacing:'.06em',color:'#64748b',background:'#f8fafc',padding:'12px 14px',borderBottom:'1px solid #e5e7eb'},
  td:{padding:'12px 14px',borderBottom:'1px solid #eef2f7',color:'#334155',fontSize:14,whiteSpace:'nowrap'},
  tdStrong:{padding:'12px 14px',borderBottom:'1px solid #eef2f7',color:'#0f172a',fontSize:16,fontWeight:900,whiteSpace:'nowrap'},
  goodPill:{display:'inline-block',padding:'5px 8px',borderRadius:999,background:'#dcfce7',color:'#166534',fontSize:12,fontWeight:800},
  warnPill:{display:'inline-block',padding:'5px 8px',borderRadius:999,background:'#fef3c7',color:'#92400e',fontSize:12,fontWeight:800},
};
