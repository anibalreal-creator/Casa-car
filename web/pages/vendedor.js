import { useEffect, useMemo, useState } from "react";
import SellerPanel from "../components/SellerPanel";

export default function VendedorPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/listings")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]));
  }, []);

  const top = useMemo(() => items.slice(0, 5), [items]);

  return (
    <div style={{background:"#f5f7fb",minHeight:"100vh",padding:"28px 16px",fontFamily:"Arial, sans-serif"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <h1 style={{fontSize:46,margin:"0 0 6px 0"}}>Panel vendedor</h1>
        <p style={{color:"#6b7280",marginBottom:18}}>Resumen rápido de tus publicaciones.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18}}>
          {top.map((item) => (
            <div key={item.id}>
              <SellerPanel item={item} />
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:14,marginTop:10}}>
                <div style={{fontWeight:800,marginBottom:6}}>{item.title}</div>
                <div>{item.city}, {item.country}</div>
                <div>{item.currency} {item.price}</div>
                <a href={`/listing/${item.id}`} style={{display:"inline-block",marginTop:10,textDecoration:"none",background:"#1d4ed8",color:"#fff",padding:"10px 12px",borderRadius:10,fontWeight:700}}>Ver anuncio</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
