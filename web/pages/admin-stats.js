import { useEffect, useMemo, useState } from "react";
import FooterBlueBar from "../components/FooterBlueBar";

export default function AdminStatsPage() {
  const [listings, setListings] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch("/api/listings").then(r => r.json()).then(d => setListings(Array.isArray(d) ? d : []));
    fetch('/api/admin-events', { method: 'POST', headers: { 'x-casa-request': '1' } }).then(r => r.json()).then(d => setEvents(Array.isArray(d) ? d : []));
  }, []);

  const stats = useMemo(() => ({
    totalListings: listings.length,
    totalViews: listings.reduce((a, x) => a + Number(x.views || 0), 0),
    totalEvents: events.length,
    shares: events.filter((x) => x.event_type === "share").length
  }), [listings, events]);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Estadísticas completas</h1>
        <div style={styles.grid}>
          <Card label="Anuncios" value={stats.totalListings} />
          <Card label="Visitas" value={stats.totalViews} />
          <Card label="Eventos" value={stats.totalEvents} />
          <Card label="Compartidos" value={stats.shares} />
        </div>
      </div>
      <FooterBlueBar />
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value}</div>
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",padding:"28px 16px",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:1200,margin:"0 auto"},
  title:{fontSize:44,margin:"0 0 18px 0"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16},
  card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:16},
  label:{fontSize:13,color:"#6b7280",marginBottom:8},
  value:{fontSize:34,fontWeight:800}
};
