import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { secureFetch } from "../lib/secureClient";
import SellerStats from "../components/SellerStats";
import VerifiedBadge from "../components/VerifiedBadge";
import FooterBlueBar from "../components/FooterBlueBar";

export default function PanelVendedor() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ display_name: "", bio: "", phone: "", city: "", country: "" });

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(async ({ data }) => {
      const u = data.user || null;
      setUser(u);
      if (!u) return;

      const p = await fetch(`/api/seller-profile?user_id=${u.id}`).then(r => r.json()).catch(() => null);
      if (p) {
        setProfile(p);
        setForm({
          display_name: p.display_name || "",
          bio: p.bio || "",
          phone: p.phone || "",
          city: p.city || "",
          country: p.country || ""
        });
      }

      const list = await fetch(`/api/listings?user_id=${u.id}`).then(r => r.json()).catch(() => []);
      setItems(Array.isArray(list) ? list : []);
    });
  }, []);

  const stats = useMemo(() => ({
    total: items.length,
    premium: items.filter((x) => x.is_premium).length,
    featured: items.filter((x) => x.featured).length,
    views: items.reduce((acc, x) => acc + Number(x.views || 0), 0),
  }), [items]);

  async function saveProfile(e) {
    e.preventDefault();
    if (!user) return;
    const res = await secureFetch("/api/seller-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "No se pudo guardar");
    setProfile(data);
    alert("Perfil guardado");
  }

  if (!user) {
    return <div style={styles.page}><div style={styles.wrap}><h1>Panel vendedor</h1><p>Iniciá sesión para ver tu panel.</p></div></div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Panel vendedor</h1>
        <div style={{marginBottom:12}}><VerifiedBadge verified={profile?.is_verified} /></div>
        <SellerStats stats={stats} />

        <form onSubmit={saveProfile} style={styles.form}>
          <h2 style={{margin:"0 0 10px 0"}}>Perfil público</h2>
          <input style={styles.input} placeholder="Nombre visible" value={form.display_name} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} />
          <textarea style={styles.textarea} placeholder="Bio / descripción" value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
          <div style={styles.row}>
            <input style={styles.input} placeholder="Teléfono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            <input style={styles.input} placeholder="Ciudad" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <input style={styles.input} placeholder="País" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
          <button type="submit" style={styles.button}>Guardar perfil</button>
        </form>

        <div style={{marginTop:18}}>
          <a href={`/vendedor-publico?id=${encodeURIComponent(user.id)}`} style={styles.publicLink}>Ver perfil público</a>
        </div>
      </div>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",padding:"28px 16px",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:1000,margin:"0 auto"},
  title:{fontSize:46,margin:"0 0 16px 0"},
  form:{marginTop:18,background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:16,display:"grid",gap:12},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
  input:{padding:"14px 16px",border:"1px solid #d1d5db",borderRadius:12,fontSize:16,background:"#fff"},
  textarea:{padding:"14px 16px",border:"1px solid #d1d5db",borderRadius:12,fontSize:16,minHeight:120},
  button:{background:"#0f172a",color:"#fff",border:"none",padding:"14px 18px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  publicLink:{display:"inline-block",textDecoration:"none",background:"#1d4ed8",color:"#fff",padding:"12px 16px",borderRadius:12,fontWeight:700}
};
