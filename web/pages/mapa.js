import { useState } from "react";
import MapSearchBox from "../components/MapSearchBox";

export default function MapaPage() {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Mapa de búsqueda</h1>
        <p style={styles.subtitle}>Buscá propiedades o vehículos por zona.</p>
        <MapSearchBox city={city} setCity={setCity} country={country} setCountry={setCountry} />
        <iframe
          title="Mapa"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-58.6%2C-34.9%2C-58.3%2C-34.5&layer=mapnik&marker=-34.7%2C-58.45"
          style={styles.frame}
        />
      </div>
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",fontFamily:"Arial, sans-serif",padding:"28px 16px"},
  wrap:{maxWidth:1200,margin:"0 auto"},
  title:{fontSize:48,margin:"0 0 8px 0"},
  subtitle:{color:"#6b7280",marginBottom:16},
  frame:{width:"100%",height:560,border:0,borderRadius:18,background:"#fff"}
};
