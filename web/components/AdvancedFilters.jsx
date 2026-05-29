import { CATEGORIES, COUNTRIES } from "../data/options";

export default function AdvancedFilters({ search, setSearch, category, setCategory, country, setCountry, minPrice, setMinPrice, maxPrice, setMaxPrice }) {
  return (
    <section style={styles.wrap}>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, ciudad, país, zona o dirección" style={styles.inputWide} />
      <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.input}>
        <option value="">Todas las categorías</option>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <select value={country} onChange={(e) => setCountry(e.target.value)} style={styles.input}>
        <option value="">Todos los países</option>
        {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Precio mínimo" style={styles.input} />
      <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Precio máximo" style={styles.input} />
    </section>
  );
}

const styles = {
  wrap: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10, background: "#fff", border: "1px solid #e5e7eb", padding: 12, borderRadius: 16, marginBottom: 18 },
  inputWide: { padding: "14px 16px", border: "1px solid #d1d5db", borderRadius: 12, fontSize: 16 },
  input: { padding: "14px 16px", border: "1px solid #d1d5db", borderRadius: 12, fontSize: 16, background: "#fff" }
};
