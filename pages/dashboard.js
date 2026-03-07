import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data?.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  async function signIn() {
    setMsg("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      setMsg("✅ Login OK");
    } catch (e) {
      setMsg(`❌ ${e?.message || "Error"}`);
    }
  }

  async function signUp() {
    setMsg("");
    try {
      const { error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;
      setMsg("✅ Registro OK (si pide confirmación, revisá el mail)");
    } catch (e) {
      setMsg(`❌ ${e?.message || "Error"}`);
    }
  }

  async function signOut() {
    setMsg("");
    await supabase.auth.signOut();
    setMsg("✅ Saliste");
  }

  const styles = {
    wrap: { maxWidth: 760, margin: "40px auto", padding: 16 },
    card: { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: 18, background: "white" },
    row: { display: "flex", gap: 12, flexWrap: "wrap" },
    col: { display: "flex", flexDirection: "column", gap: 6, flex: "1 1 220px" },
    label: { fontWeight: 800 },
    input: { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.2)", fontSize: 14 },
    btnRow: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
    btn: (primary) => ({
      padding: "10px 14px",
      borderRadius: 10,
      border: primary ? "none" : "1px solid rgba(0,0,0,0.2)",
      background: primary ? "black" : "white",
      color: primary ? "white" : "black",
      cursor: "pointer",
    }),
    msg: { marginTop: 12, fontWeight: 800 },
    muted: { color: "rgba(0,0,0,0.65)" },
  };

  return (
    <div style={styles.wrap}>
      <h1 style={{ margin: 0 }}>Dashboard</h1>
      <div style={styles.muted}>Login simple para poder publicar anuncios.</div>
      <Nav />

      <div style={styles.card}>
        {session ? (
          <>
            <div style={{ fontWeight: 900 }}>Logueado como:</div>
            <div style={{ marginTop: 6 }}>{session.user.email}</div>
            <div style={styles.btnRow}>
              <button style={styles.btn(true)} onClick={() => (window.location.href = "/publicar")}>
                Ir a Publicar
              </button>
              <button style={styles.btn(false)} onClick={signOut}>
                Salir
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Password</label>
                <input style={styles.input} type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
              </div>
            </div>

            <div style={styles.btnRow}>
              <button style={styles.btn(true)} onClick={signIn}>Login</button>
              <button style={styles.btn(false)} onClick={signUp}>Crear cuenta</button>
            </div>
          </>
        )}

        {msg && <div style={styles.msg}>{msg}</div>}
      </div>
    </div>
  );
}
