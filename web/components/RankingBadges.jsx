export default function RankingBadges({ item }) {
  return (
    <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
      {item.is_premium ? <span style={styles.premium}>Premium</span> : null}
      {item.featured ? <span style={styles.featured}>Destacado</span> : null}
      {(item.views || 0) > 100 ? <span style={styles.hot}>Muy visto</span> : null}
    </div>
  );
}

const styles = {
  premium:{background:"#7c3aed",color:"#fff",padding:"4px 8px",borderRadius:999,fontSize:12,fontWeight:800},
  featured:{background:"#f59e0b",color:"#fff",padding:"4px 8px",borderRadius:999,fontSize:12,fontWeight:800},
  hot:{background:"#059669",color:"#fff",padding:"4px 8px",borderRadius:999,fontSize:12,fontWeight:800}
};
