
import VerifiedBadge from "./VerifiedBadge";
import StarRating from "./StarRating";

export default function SellerTrustPanel({ seller }) {
  if (!seller) return null;
  const name = seller.display_name || seller.company_name || seller.name || "Vendedor";
  const joined = seller.created_at ? new Date(seller.created_at).toLocaleDateString("es-AR") : null;

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>Confianza del vendedor</div>
          <h3 style={styles.name}>{name}</h3>
        </div>
        <VerifiedBadge verified={seller.verified} />
      </div>

      <div style={styles.grid}>
        <div style={styles.metricBox}>
          <span style={styles.metricLabel}>Reputación</span>
          <StarRating value={seller.rating_avg || 0} count={seller.reviews_count || 0} />
        </div>
        <div style={styles.metricBox}>
          <span style={styles.metricLabel}>Publicaciones activas</span>
          <strong style={styles.metricValue}>{Number(seller.active_listings || 0)}</strong>
        </div>
        <div style={styles.metricBox}>
          <span style={styles.metricLabel}>Miembro desde</span>
          <strong style={styles.metricValue}>{joined || "-"}</strong>
        </div>
      </div>
    </section>
  );
}

const styles = {
  card:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:18,boxShadow:'0 12px 28px rgba(15,23,42,.06)',display:'grid',gap:16},
  header:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'},
  kicker:{fontSize:12,fontWeight:900,letterSpacing:.6,color:'#2563eb',textTransform:'uppercase'},
  name:{margin:'6px 0 0',fontSize:22,color:'#111827'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:12},
  metricBox:{background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:14,padding:14,display:'grid',gap:8},
  metricLabel:{fontSize:12,color:'#64748b',fontWeight:800,textTransform:'uppercase'},
  metricValue:{fontSize:18,color:'#111827'}
};
