export default function SellerStats({ stats }) {
  const items = [["Anuncios", stats.total || 0],["Premium", stats.premium || 0],["Destacados", stats.featured || 0],["Visitas", stats.views || 0]];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
      {items.map(([label, value]) => (
        <div key={label} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:14}}>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:8}}>{label}</div>
          <div style={{fontSize:28,fontWeight:800}}>{value}</div>
        </div>
      ))}
    </div>
  );
}
