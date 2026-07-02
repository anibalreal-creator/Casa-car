import { useEffect, useMemo, useState } from "react";
import GlobalHeader from "../../components/GlobalHeader";
import FooterBlueBar from "../../components/FooterBlueBar";
import { supabaseBrowser } from "../../lib/supabaseBrowser";

function StatCard({ label, value, hint }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
      {hint ? <div style={styles.statHint}>{hint}</div> : null}
    </div>
  );
}

export default function AdminDashboard() {
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminOverview, setAdminOverview] = useState(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncing, setSyncing] = useState(false);

  async function fetchJson(path, token) {
    const response = await fetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `No se pudo cargar ${path}`);
    }
    return payload;
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const session = data?.session || null;
      const nextUser = session?.user || null;
      setUser(nextUser);

      if (!session?.access_token) {
        setHealth(null);
        setAnalytics(null);
        setLoading(false);
        return;
      }

      const [healthPayload, analyticsPayload, overviewPayload] = await Promise.all([
        fetchJson("/api/secure/final-health", session.access_token),
        fetchJson("/api/secure/owner/analytics", session.access_token),
        fetchJson("/api/secure/admin/overview", session.access_token).catch(() => null),
      ]);

      setHealth(healthPayload);
      setAnalytics(analyticsPayload);
      setAdminOverview(overviewPayload);
    } catch (err) {
      setError(err?.message || "No se pudo cargar el panel");
      setHealth(null);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange(() => {
      loadDashboard();
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const counts = health?.counts || {};
  const analyticsStats = analytics?.stats || {};
  const onlineNow = analyticsStats.online_now ?? analytics?.online_now ?? 0;
  const authNow = analyticsStats.authenticated_online_now ?? analytics?.authenticated_online_now ?? 0;
  const visitorsToday = analyticsStats.unique_visitors_today ?? analytics?.unique_visitors_today ?? 0;
  const usersToday = analyticsStats.unique_users_today ?? analytics?.unique_users_today ?? 0;
  const registrations = analytics?.registrations || {};
  const recentRegistrations = Array.isArray(registrations.recent) ? registrations.recent : [];
  const dailyRegistrations = Array.isArray(registrations.dailyLast30) ? registrations.dailyLast30 : [];
  const monthlyRegistrations = Array.isArray(registrations.monthlyLast12) ? registrations.monthlyLast12 : [];


  async function syncCampaignsNow() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const session = data?.session || null;
      if (!session?.access_token) throw new Error("Tenés que iniciar sesión");
      const payload = await fetchJson("/api/secure/admin/sync-campaigns", session.access_token);
      setSyncMessage(`Campañas sincronizadas: ${payload?.campaigns?.length || 0} revisadas · ${payload?.syncedAt || "ok"}`);
      await loadDashboard();
    } catch (err) {
      setSyncMessage(err?.message || "No se pudo sincronizar campañas");
    } finally {
      setSyncing(false);
    }
  }

  const cards = useMemo(() => ([
    { label: "Clientes nuevos hoy", value: registrations.today ?? 0, hint: "cuentas creadas hoy" },
    { label: "Clientes nuevos mes", value: registrations.thisMonth ?? 0, hint: "altas del mes actual" },
    { label: "Clientes ultimos 30 dias", value: registrations.last30Days ?? 0, hint: "emails registrados recientes" },
    { label: "Cuentas registradas", value: registrations.total ?? 0, hint: "total real en Supabase Auth" },
    { label: "Usuarios online", value: onlineNow, hint: "actividad viva en los últimos minutos" },
    { label: "Usuarios logueados online", value: authNow, hint: "sesiones autenticadas activas" },
    { label: "Visitantes únicos hoy", value: visitorsToday, hint: "incluye anónimos y logueados" },
    { label: "Usuarios únicos hoy", value: usersToday, hint: "solo cuentas autenticadas" },
    { label: "Perfiles", value: counts.profiles ?? 0, hint: "tabla profiles" },
    { label: "Suscripciones", value: counts.subscriptions ?? 0, hint: "planes y owner/admin" },
    { label: "Anuncios", value: counts.listings ?? 0, hint: "publicaciones en listings" },
    { label: "Campañas", value: counts.campaigns ?? 0, hint: "publicidad activa / histórica" },
    { label: "Favoritos", value: counts.favorites ?? 0, hint: "guardados privados por usuario" },
    { label: "Pagos", value: counts.payments ?? 0, hint: "tabla payments" },
  ]), [onlineNow, authNow, visitorsToday, usersToday, counts, registrations]);

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <div style={styles.wrap}>
        <div style={styles.hero}>
          <div>
            <div style={styles.kicker}>ADMIN / ANALYTICS</div>
            <h1 style={styles.title}>Panel visual final</h1>
            <p style={styles.text}>
              Estado del marketplace, actividad en vivo y chequeo SaaS en una sola pantalla.
            </p>
          </div>
          <div style={styles.heroActions}>
            <a href="/dashboard/analytics" style={styles.primary}>Ver analytics</a>
            <button onClick={syncCampaignsNow} style={styles.secondaryButton} disabled={syncing}>{syncing ? "Sincronizando campañas…" : "Sync campañas"}</button>
            <a href="/api/secure/final-health" style={styles.secondary}>Abrir health JSON</a>
          </div>
        </div>

        {!user ? (
          <div style={styles.notice}>
            Necesitás iniciar sesión con la cuenta dueña para ver este panel.
          </div>
        ) : null}

        {loading ? <div style={styles.notice}>Cargando panel…</div> : null}
        {error ? <div style={styles.error}>{error}</div> : null}
        {syncMessage ? <div style={styles.notice}>{syncMessage}</div> : null}

        {!loading && !error ? (
          <>
            <div style={styles.grid}>
              {cards.map((card) => (
                <StatCard key={card.label} label={card.label} value={card.value} hint={card.hint} />
              ))}
            </div>

            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>Altas de clientes</h2>
              <p style={styles.panelText}>
                Conteo privado solo para la cuenta dueña. Toma los usuarios reales de Supabase Auth y agrupa las fechas en horario argentino.
              </p>
              <div style={styles.adminGrid}>
                <div style={styles.miniStat}><span>Hoy</span><strong>{registrations.today ?? 0}</strong></div>
                <div style={styles.miniStat}><span>Ultimos 7 dias</span><strong>{registrations.last7Days ?? 0}</strong></div>
                <div style={styles.miniStat}><span>Ultimos 30 dias</span><strong>{registrations.last30Days ?? 0}</strong></div>
                <div style={styles.miniStat}><span>Este mes</span><strong>{registrations.thisMonth ?? 0}</strong></div>
                <div style={styles.miniStat}><span>Total cuentas</span><strong>{registrations.total ?? 0}</strong></div>
                <div style={styles.miniStat}><span>Confirmadas</span><strong>{registrations.confirmed ?? 0}</strong></div>
              </div>
              <div style={styles.registrationGrid}>
                <div style={styles.registrationBox}>
                  <h3 style={styles.smallTitle}>Por dia, ultimos 14 dias</h3>
                  <div style={styles.dataRows}>
                    {dailyRegistrations.slice(-14).map((item) => (
                      <div key={item.day} style={styles.dataRow}>
                        <span>{item.day}</span>
                        <strong>{item.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={styles.registrationBox}>
                  <h3 style={styles.smallTitle}>Por mes</h3>
                  <div style={styles.dataRows}>
                    {monthlyRegistrations.map((item) => (
                      <div key={item.month} style={styles.dataRow}>
                        <span>{item.month}</span>
                        <strong>{item.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={styles.registrationBox}>
                  <h3 style={styles.smallTitle}>Ultimas cuentas</h3>
                  <div style={styles.dataRows}>
                    {recentRegistrations.map((item) => (
                      <div key={item.id} style={styles.dataRow}>
                        <span>{item.email || "sin email"}</span>
                        <strong>{item.confirmed ? "OK" : "Pend."}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.sectionGrid}>
              <div style={styles.panel}>
                <h2 style={styles.panelTitle}>Checklist de cierre</h2>
                <ul style={styles.list}>
                  <li>Login de owner / admin correcto</li>
                  <li>Favoritos unificados con Supabase</li>
                  <li>Mis anuncios privados por usuario</li>
                  <li>Campañas con UUID consistente</li>
                  <li>Suscripciones con estado y fechas</li>
                  <li>Analítica base de presencia funcionando</li>
                </ul>
              </div>

              <div style={styles.panel}>
                <h2 style={styles.panelTitle}>Atajos</h2>
                <div style={styles.links}>
                  <a href="/mis-anuncios" style={styles.linkCard}>Mis anuncios</a>
                  <a href="/favoritos" style={styles.linkCard}>Favoritos</a>
                  <a href="/publicidad/panel" style={styles.linkCard}>Publicidad</a>
                  <a href="/dashboard/saas" style={styles.linkCard}>Dashboard SaaS</a>
                  <a href="/dashboard/analytics" style={styles.linkCard}>Analytics visual</a>
                  <a href="/planes" style={styles.linkCard}>Planes</a>
                </div>
              </div>
            </div>

            {adminOverview ? (
              <div style={styles.panel}>
                <h2 style={styles.panelTitle}>Resumen admin real</h2>
                <div style={styles.adminGrid}>
                  <div style={styles.miniStat}><span>Usuarios</span><strong>{adminOverview.users ?? 0}</strong></div>
                  <div style={styles.miniStat}><span>Anuncios</span><strong>{adminOverview.listings ?? 0}</strong></div>
                  <div style={styles.miniStat}><span>Premium</span><strong>{adminOverview.premiumListings ?? 0}</strong></div>
                  <div style={styles.miniStat}><span>Campañas</span><strong>{adminOverview.campaigns ?? 0}</strong></div>
                  <div style={styles.miniStat}><span>Campañas activas</span><strong>{adminOverview.activeCampaigns ?? 0}</strong></div>
                  <div style={styles.miniStat}><span>Suscripciones activas</span><strong>{adminOverview.activeSubscriptions ?? 0}</strong></div>
                  <div style={styles.miniStat}><span>Reportes pendientes</span><strong>{adminOverview.pendingReports ?? 0}</strong></div>
                  <div style={styles.miniStat}><span>Rating promedio</span><strong>{adminOverview.averageRating ?? 0}</strong></div>
                </div>
              </div>
            ) : null}

            <div style={styles.metaBox}>
              <strong>Owner detectado:</strong> {health?.owner || user?.email || "sin detectar"}
              <br />
              <strong>Último chequeo:</strong> {health?.checkedAt || analytics?.checkedAt || "sin dato"}
            </div>
          </>
        ) : null}
      </div>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:"#f8fafc",minHeight:"100vh"},
  wrap:{maxWidth:1240,margin:"0 auto",padding:"28px 20px 56px"},
  hero:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:18,background:"linear-gradient(135deg,#111827,#1d4ed8)",color:"#fff",borderRadius:28,padding:"28px 28px 24px",marginBottom:24,boxShadow:"0 18px 40px rgba(15,23,42,.18)"},
  kicker:{fontSize:12,fontWeight:900,letterSpacing:".12em",opacity:.8,marginBottom:10},
  title:{fontSize:42,lineHeight:1.02,margin:"0 0 10px",fontWeight:900},
  text:{fontSize:17,opacity:.92,maxWidth:700,margin:0},
  heroActions:{display:"flex",gap:12,flexWrap:"wrap"},
  primary:{textDecoration:"none",background:"#fff",color:"#111827",padding:"12px 16px",borderRadius:12,fontWeight:900},
  secondary:{textDecoration:"none",background:"rgba(255,255,255,.12)",color:"#fff",padding:"12px 16px",borderRadius:12,fontWeight:800,border:"1px solid rgba(255,255,255,.22)"},
  secondaryButton:{appearance:"none",border:"1px solid rgba(255,255,255,.22)",background:"rgba(255,255,255,.12)",color:"#fff",padding:"12px 16px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  notice:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:18,color:"#111827",marginBottom:18},
  error:{background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:18,padding:18,color:"#9f1239",marginBottom:18,fontWeight:700},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:22},
  statCard:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:22,padding:20,boxShadow:"0 8px 22px rgba(15,23,42,.05)"},
  statLabel:{fontSize:12,textTransform:"uppercase",letterSpacing:".08em",color:"#6b7280",fontWeight:900,marginBottom:10},
  statValue:{fontSize:38,lineHeight:1,fontWeight:900,color:"#111827",marginBottom:8},
  statHint:{fontSize:14,color:"#6b7280"},
  sectionGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16,marginBottom:22},
  panel:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:22,padding:22,boxShadow:"0 8px 22px rgba(15,23,42,.05)"},
  panelTitle:{fontSize:24,margin:"0 0 14px",fontWeight:900,color:"#111827"},
  panelText:{margin:"-4px 0 16px",color:"#64748b",lineHeight:1.5},
  list:{margin:0,paddingLeft:20,color:"#374151",lineHeight:1.8},
  links:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12},
  linkCard:{textDecoration:"none",padding:"14px 16px",border:"1px solid #dbeafe",background:"#eff6ff",borderRadius:14,color:"#1d4ed8",fontWeight:800},
  adminGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12},
  miniStat:{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:14,padding:"14px 16px",display:"grid",gap:6,color:"#475569"},
  registrationGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14,marginTop:16},
  registrationBox:{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:16,padding:16,minWidth:0},
  smallTitle:{fontSize:16,margin:"0 0 12px",color:"#111827",fontWeight:900},
  dataRows:{display:"grid",gap:8},
  dataRow:{display:"flex",justifyContent:"space-between",gap:10,borderBottom:"1px solid #e5e7eb",paddingBottom:8,color:"#475569",fontSize:14},
  metaBox:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:18,color:"#374151",boxShadow:"0 8px 22px rgba(15,23,42,.05)"},
};
