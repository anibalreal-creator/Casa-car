import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import VerifiedBadge from "../../components/VerifiedBadge";
import SellerStats from "../../components/SellerStats";
import FooterBlueBar from "../../components/FooterBlueBar";

export default function SellerPublicPage() {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/seller-profile?user_id=${id}`).then((r) => r.json()).then((d) => setProfile(d || null)).catch(() => setProfile(null));
    fetch(`/api/listings?user_id=${id}`).then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([]));
  }, [id]);

  const stats = useMemo(() => ({
    total: items.length,
    premium: items.filter((x) => x.is_premium).length,
    featured: items.filter((x) => x.featured).length,
    views: items.reduce((acc, x) => acc + Number(x.views || 0), 0),
  }), [items]);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <a href="/" style={styles.back}>← Volver</a>
        <div style={styles.hero}>
          <div>
            <h1 style={styles.title}>{profile?.display_name || "Vendedor"}</h1>
            <div style={{marginBottom:10}}><VerifiedBadge verified={profile?.is_verified} /></div>
            <p style={styles.bio}>{profile?.bio || "Perfil público del vendedor."}</p>
            <div style={styles.meta}>{profile?.city || ""}{profile?.city && profile?.country ? ", " : ""}{profile?.country || ""}</div>
          </div>
        </div>
        <div style={{marginTop:18}}><SellerStats stats={stats} /></div>
        <h2 style={styles.sectionTitle}>Anuncios del vendedor</h2>
        <div style={styles.grid}>
          {items.map((item) => (
            <div key={item.id} style={styles.card}>
              <img src={item.images?.[0] || "https://picsum.photos/seed/fallback/900/600"} alt={item.title} style={styles.image} />
              <div style={styles.body}>
                <h3 style={{margin:"0 0 8px 0"}}>{item.title}</h3>
                <div style={styles.price}>{item.currency} {item.price}</div>
                <div style={styles.city}>{item.city}, {item.country}</div>
                <a href={`/listing/${item.id}`} style={styles.link}>Ver anuncio</a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",padding:"28px 16px",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:1200,margin:"0 auto"},
  back:{display:"inline-block",marginBottom:18,textDecoration:"none",color:"#111827",fontWeight:700},
  hero:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:18},
  title:{fontSize:42,margin:"0 0 8px 0"},
  bio:{color:"#4b5563",margin:"0 0 10px 0"},
  meta:{color:"#6b7280"},
  sectionTitle:{margin:"24px 0 12px 0"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:18},
  card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden"},
  image:{width:"100%",height:180,objectFit:"contain",background:"#f8fafc",display:"block"},
  body:{padding:14},
  price:{fontWeight:800,fontSize:22},
  city:{color:"#2563eb",fontWeight:700,marginTop:6,marginBottom:10},
  link:{textDecoration:"none",background:"#1d4ed8",color:"#fff",padding:"10px 12px",borderRadius:10,fontWeight:700,display:"inline-block"}
};
