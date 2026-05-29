export default function AddressField({
  address, setAddress,
  zone, setZone,
  city, setCity,
  state, setState,
  country, setCountry,
  setLat, setLng
}) {
  async function geocode() {
    const query = [address, zone, city, state, country].filter(Boolean).join(" ");
    if (!query) return;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    const r = await fetch(url);
    const data = await r.json();
    if (data && data[0]) {
      setLat(data[0].lat);
      setLng(data[0].lon);
      alert("Ubicación encontrada");
    } else {
      alert("No se encontró la dirección");
    }
  }

  return (
    <div style={{display:"grid",gap:10}}>
      <input placeholder="Dirección" value={address||""} onChange={e=>setAddress(e.target.value)} style={input}/>
      <input placeholder="Zona / barrio" value={zone||""} onChange={e=>setZone(e.target.value)} style={input}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <input placeholder="Ciudad" value={city||""} onChange={e=>setCity(e.target.value)} style={input}/>
        <input placeholder="Provincia / Estado" value={state||""} onChange={e=>setState(e.target.value)} style={input}/>
      </div>
      <input placeholder="País" value={country||""} onChange={e=>setCountry(e.target.value)} style={input}/>
      <button type="button" onClick={geocode} style={btn}>Buscar ubicación en mapa</button>
    </div>
  )
}

const input={padding:"14px",border:"1px solid #ccc",borderRadius:10,fontSize:16}
const btn={background:"#0f172a",color:"#fff",border:"none",padding:"14px 18px",borderRadius:10,fontWeight:700,cursor:"pointer"}
