export default function SellerPanel({ item }) {
  return (
    <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:16}}>
      <div style={{fontWeight:800,fontSize:20,marginBottom:12}}>Panel vendedor</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:12}}>
          <div style={{fontSize:13,color:"#6b7280"}}>Visitas</div>
          <div style={{fontSize:26,fontWeight:800}}>{item.views || 0}</div>
        </div>
        <div style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:12}}>
          <div style={{fontSize:13,color:"#6b7280"}}>Estado</div>
          <div style={{fontSize:26,fontWeight:800}}>{item.is_premium ? "Premium" : item.featured ? "Destacado" : "Normal"}</div>
        </div>
      </div>
    </div>
  );
}
