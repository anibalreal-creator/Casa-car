import { useEffect, useState } from "react";
import RecommendationList from "../components/RecommendationList";
import FooterBlueBar from "../components/FooterBlueBar";

export default function RecomendadosPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch("/api/recommendations").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([]));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>IA que recomienda anuncios</h1>
        <p style={styles.subtitle}>Motor heurístico base para detectar anuncios atractivos y relevantes.</p>
        <RecommendationList items={items} />
      </div>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",padding:"28px 16px",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:1200,margin:"0 auto"},
  title:{fontSize:46,margin:"0 0 6px 0"},
  subtitle:{color:"#6b7280",marginBottom:18}
};
