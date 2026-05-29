export default function AdminStatCard({ label, value, accent = "#1d4ed8" }) {
  return (
    <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:16}}>
      <div style={{fontSize:13,color:"#6b7280",marginBottom:8}}>{label}</div>
      <div style={{fontSize:34,fontWeight:800,color:accent}}>{value}</div>
    </div>
  );
}
