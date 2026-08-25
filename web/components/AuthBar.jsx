import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseBrowser";

export default function AuthBar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    window.location.reload();
  }

  return (
    <div style={styles.wrap}>
      {user ? (
        <>
          <span style={styles.user}>{user.email}</span>
          <a href="/mis-anuncios" style={styles.link}>Mis anuncios</a>
          <button onClick={signOut} style={styles.buttonAlt}>Cerrar sesion</button>
        </>
      ) : (
        <a href="/login" style={styles.button}>Ingresar</a>
      )}
    </div>
  );
}

const styles = {
  wrap: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  user: { fontWeight: 700 },
  link: { textDecoration: "none", color: "#2563eb", fontWeight: 700 },
  button: { background: "#111827", color: "#fff", border: "none", borderRadius: 12, padding: "12px 14px", fontWeight: 700, cursor: "pointer", textDecoration: "none" },
  buttonAlt: { background: "#fff", color: "#111827", border: "1px solid #d1d5db", borderRadius: 12, padding: "12px 14px", fontWeight: 700, cursor: "pointer" },
};
