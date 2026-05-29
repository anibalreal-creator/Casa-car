export default function RecommendationList({ items = [] }) {
  return (
    <div style={styles.grid}>
      {items.map((item) => (
        <div key={item.id} style={styles.card}>
          <img src={item.images?.[0] || "https://picsum.photos/seed/fallback/600/400"} alt={item.title} style={styles.image} />
          <div style={styles.body}>
            <h3 style={styles.title}>{item.title}</h3>
            <div style={styles.meta}>{item.city}, {item.country}</div>
            <div style={styles.price}>{item.currency} {item.price}</div>
            <div style={styles.score}>IA score: {Math.round(Number(item.ai_score || 0))}</div>
            <a href={`/listing/${item.id}`} style={styles.link}>Ver anuncio</a>
          </div>
        </div>
      ))}
    </div>
  );
}
const styles = {
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:18},
  card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden"},
  image:{width:"100%",height:180,objectFit:"contain",background:"#f8fafc",display:"block"},
  body:{padding:14},
  title:{margin:"0 0 8px 0"},
  meta:{color:"#6b7280",marginBottom:8},
  price:{fontWeight:800,fontSize:22,marginBottom:8},
  score:{color:"#7c3aed",fontWeight:700,marginBottom:10},
  link:{display:"inline-block",textDecoration:"none",background:"#1d4ed8",color:"#fff",padding:"10px 12px",borderRadius:10,fontWeight:700}
};
