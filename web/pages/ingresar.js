import GlobalHeader from "../components/GlobalHeader";

export default function Ingresar() {
  return (
    <div style={styles.page}>
      <GlobalHeader />
      <div style={styles.wrap}>
        <h1 style={styles.title}>Ingresar</h1>
        <div style={styles.card}>
          <input placeholder="Email" style={styles.input} />
          <input placeholder="Contraseña" type="password" style={styles.input} />
          <button style={styles.button}>Entrar</button>
          <p style={styles.help}>Base visual lista para conectar con tu autenticación real.</p>
        </div>
      </div>
    </div>
  );
}
const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:700,margin:"0 auto",padding:"28px 16px"},
  title:{fontSize:32,marginBottom:14},
  card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:22,display:"grid",gap:12},
  input:{padding:"14px 16px",border:"1px solid #d1d5db",borderRadius:12,fontSize:16},
  button:{border:"none",background:"#0f172a",color:"#fff",padding:"14px 16px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  help:{color:"#6b7280",margin:0}
};
