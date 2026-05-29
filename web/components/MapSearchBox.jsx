export default function MapSearchBox({ city, setCity, country, setCountry }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.title}>Búsqueda por mapa / zona</div>
      <div style={styles.row}>
        <input
          style={styles.input}
          placeholder="Ciudad"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="País"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <a
          href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${city} ${country}`.trim())}`}
          target="_blank"
          rel="noreferrer"
          style={styles.button}
        >
          Abrir mapa
        </a>
      </div>
    </div>
  );
}

const styles = {
  wrap: { background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:16, marginBottom:16 },
  title: { fontWeight:800, marginBottom:10 },
  row: { display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10 },
  input: { padding:"14px 16px", border:"1px solid #d1d5db", borderRadius:12, fontSize:16 },
  button: { textDecoration:"none", background:"#0f172a", color:"#fff", padding:"14px 16px", borderRadius:12, fontWeight:700 }
};
