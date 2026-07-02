import { useEffect, useState } from "react";
import GlobalHeader from "../../components/GlobalHeader";
import FooterBlueBar from "../../components/FooterBlueBar";
import { supabaseBrowser } from "../../lib/supabaseBrowser";

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

  const registrations = data?.ownerAnalytics?.registrations || {};
  const cards = [
    { label: 'Clientes nuevos hoy', value: registrations.today ?? '-' },
    { label: 'Clientes nuevos mes', value: registrations.thisMonth ?? '-' },
    { label: 'Clientes ultimos 30 dias', value: registrations.last30Days ?? '-' },
    { label: 'Cuentas registradas', value: registrations.total ?? '-' },
    { label: 'Usuarios online', value: data?.ownerAnalytics?.onlineNow ?? '-' },
    { label: 'Usuarios únicos hoy', value: data?.ownerAnalytics?.dailyUniqueUsers ?? '-' },
    { label: 'Suscripciones activas', value: data?.subscriptions?.active ?? 0 },
    { label: 'Usuarios autenticados online', value: data?.ownerAnalytics?.onlineAuthenticatedNow ?? '-' },
    { label: 'Visitantes únicos hoy', value: data?.ownerAnalytics?.dailyUniqueVisitors ?? '-' },
    { label: 'Campañas activas', value: data?.campaigns?.active ?? 0 },
    { label: 'Publicaciones activas', value: data?.listings?.active ?? 0 },
    { label: 'Premium activas', value: data?.listings?.premium ?? 0 },
  ];

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <div style={styles.kicker}>SAAS</div>
        <h1 style={styles.title}>Dashboard SaaS</h1>
        <p style={styles.subtitle}>Resumen operativo de suscripciones, campañas, publicaciones y presencia en tiempo real.</p>
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
  title:{fontSize:46,margin:'12px 0 8px 0'},
  subtitle:{margin:'0 0 20px 0',fontSize:18,color:'#64748b',maxWidth:880},
  error:{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b',padding:16,borderRadius:16,marginBottom:18,fontWeight:700},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:22},
  card:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:18,boxShadow:'0 12px 30px rgba(15,23,42,.05)'},
  cardLabel:{fontSize:13,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:'.06em'},
  cardValue:{fontSize:34,fontWeight:900,color:'#0f172a',marginTop:8},
  twoCol:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18},
  panel:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:20,boxShadow:'0 12px 30px rgba(15,23,42,.05)'},
  h2:{margin:'0 0 12px 0',fontSize:22},
  list:{margin:0,paddingLeft:18,color:'#334155',display:'grid',gap:8},
};
