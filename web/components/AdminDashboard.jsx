export default function AdminDashboard({ stats }) {
  const cards = [
    ["Anuncios", stats.total || 0, "#1d4ed8"],
    ["Premium", stats.premium || 0, "#7c3aed"],
    ["Destacados", stats.featured || 0, "#f59e0b"],
    ["Visitas", stats.views || 0, "#059669"],
  ];

  return (
    <div style={styles.grid}>
      {cards.map(([label, value, color]) => (
        <div key={label} style={styles.card}>
          <div style={styles.label}>{label}</div>
          <div style={{...styles.value, color}}>{value}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:20},
  card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:16},
  label:{fontSize:13,color:"#6b7280",marginBottom:8},
  value:{fontSize:34,fontWeight:800}
};
