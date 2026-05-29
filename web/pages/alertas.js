import AlertForm from "../components/AlertForm";
import FooterBlueBar from "../components/FooterBlueBar";

export default function AlertasPage() {
  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Alertas de nuevos anuncios</h1>
        <p style={styles.subtitle}>Guardá búsquedas para seguir oportunidades automáticamente.</p>
        <AlertForm />
      </div>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",padding:"28px 16px",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:900,margin:"0 auto"},
  title:{fontSize:46,margin:"0 0 6px 0"},
  subtitle:{color:"#6b7280",marginBottom:18}
};
