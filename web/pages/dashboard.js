import { useEffect, useMemo, useState } from "react";
import GlobalHeader from "../components/GlobalHeader";
import FooterBlueBar from "../components/FooterBlueBar";
import { supabase } from "../lib/supabaseClient";
import { getAuthErrorMessage, signInWithEmail, signUpWithEmail } from "../lib/authEmail";

function toNumber(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isPremiumListing(item) {
  return Boolean(
    item?.is_premium ||
    item?.highlighted ||
    item?.featured ||
    item?.premium_plan ||
    item?.premium_expires_at ||
    item?.premium_until
  );
}

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data?.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadMine() {
      if (!session?.user?.id) {
        setItems([]);
        return;
      }
      setLoadingStats(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const response = await fetch('/api/secure/listings?mine=1&page=1&pageSize=100', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const payload = await response.json().catch(() => null);
        const nextItems = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        setItems(nextItems);
      } catch {
        setItems([]);
      } finally {
        setLoadingStats(false);
      }
    }

    loadMine();
  }, [session?.user?.id]);

  async function signIn() {
    setMsg("");
    try {
      await signInWithEmail(supabase, { email, password: pass });
      setMsg("✅ Login correcto");
    } catch (e) {
      setMsg(`❌ ${getAuthErrorMessage(e)}`);
    }
  }

  async function signUp() {
    setMsg("");
    try {
      await signUpWithEmail(supabase, { email, password: pass });
      setMsg("Cuenta creada correctamente. Ya podes usar Casa-Car.");
      window.location.reload();
    } catch (e) {
      setMsg(`❌ ${getAuthErrorMessage(e)}`);
    }
  }

  async function signOut() {
    setMsg("");
    await supabase.auth.signOut();
    setMsg("✅ Sesión cerrada");
  }

  const stats = useMemo(() => ({
    total: items.length,
    premium: items.filter((x) => isPremiumListing(x)).length,
    featured: items.filter((x) => !!(x.highlighted || x.destacado || x.featured_until || x.fecha_destacado)).length,
    views: items.reduce((acc, x) => acc + toNumber(x.views ?? x.visitas), 0),
  }), [items]);

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <div style={styles.wrap}>
        <div style={styles.kicker}>ACCESO</div>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Tu centro rápido para entrar, publicar, revisar tus anuncios y seguir el crecimiento del marketplace.</p>

        <div style={styles.grid}>
          <section style={styles.card}>
            {session ? (
              <>
                <div style={styles.sessionBadge}>Sesión activa</div>
                <h2 style={styles.sectionTitle}>Bienvenido</h2>
                <div style={styles.email}>{session.user.email}</div>
                <div style={styles.actions}>
                  <a href="/publicar" style={styles.primary}>Publicar anuncio</a>
                  <a href="/mis-anuncios" style={styles.secondary}>Mis anuncios</a>
                  <a href="/panel-vendedor" style={styles.secondary}>Panel vendedor</a>
                  <a href="/dashboard/company" style={styles.secondary}>Dashboard empresa</a>
                  <a href="/panel-empresas" style={styles.secondary}>Panel empresas</a>
                  <a href="/publicidad/panel" style={styles.secondary}>Crear campaña</a>
                  <button type="button" onClick={signOut} style={styles.ghost}>Salir</button>
                </div>
              </>
            ) : (
              <>
                <h2 style={styles.sectionTitle}>Ingresá o creá tu cuenta</h2>
                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>Email</label>
                    <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Password</label>
                    <input style={styles.input} type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
                  </div>
                </div>
                <div style={styles.actions}>
                  <button type="button" onClick={signIn} style={styles.primary}>Ingresar</button>
                  <button type="button" onClick={signUp} style={styles.secondary}>Crear cuenta</button>
                </div>
              </>
            )}
            {msg ? <div style={styles.msg}>{msg}</div> : null}
          </section>

          <aside style={styles.sideCol}>
            <div style={styles.statCard}><div style={styles.statLabel}>Anuncios tuyos</div><div style={styles.statValue}>{loadingStats ? '…' : stats.total}</div></div>
            <div style={styles.statCard}><div style={styles.statLabel}>Premium</div><div style={styles.statValue}>{loadingStats ? '…' : stats.premium}</div></div>
            <div style={styles.statCard}><div style={styles.statLabel}>Destacados</div><div style={styles.statValue}>{loadingStats ? '…' : stats.featured}</div></div>
            <div style={styles.statCard}><div style={styles.statLabel}>Visitas acumuladas</div><div style={styles.statValue}>{loadingStats ? '…' : stats.views}</div></div>
          </aside>
        </div>
      </div>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:1200,margin:"0 auto",padding:"28px 16px 40px"},
  kicker:{display:"inline-block",padding:"6px 10px",borderRadius:999,background:"#ede9fe",color:"#6d28d9",fontWeight:800,fontSize:12,letterSpacing:".08em"},
  title:{fontSize:48,margin:"12px 0 8px 0"},
  subtitle:{fontSize:18,color:"#6b7280",margin:"0 0 22px 0",maxWidth:760},
  grid:{display:"grid",gridTemplateColumns:"1.4fr .8fr",gap:18,alignItems:"start"},
  card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:22,boxShadow:"0 8px 24px rgba(15,23,42,.05)"},
  sideCol:{display:"grid",gap:14},
  statCard:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:18},
  statLabel:{fontSize:13,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"},
  statValue:{fontSize:34,fontWeight:900,color:"#111827",marginTop:8},
  sectionTitle:{fontSize:30,margin:"0 0 12px 0"},
  sessionBadge:{display:"inline-block",padding:"6px 10px",borderRadius:999,background:"#dcfce7",color:"#166534",fontWeight:800,fontSize:12,marginBottom:14},
  email:{fontSize:20,fontWeight:800,color:"#111827",marginBottom:16},
  formRow:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
  field:{display:"grid",gap:8},
  label:{fontWeight:800,color:"#111827"},
  input:{padding:"14px 16px",borderRadius:12,border:"1px solid #d1d5db",fontSize:16},
  actions:{display:"flex",gap:10,flexWrap:"wrap",marginTop:14},
  primary:{textDecoration:"none",border:"none",background:"#2563eb",color:"#fff",padding:"12px 16px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  secondary:{textDecoration:"none",border:"1px solid #d1d5db",background:"#fff",color:"#111827",padding:"12px 16px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  ghost:{border:"none",background:"#111827",color:"#fff",padding:"12px 16px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  msg:{marginTop:14,fontWeight:800}
};
