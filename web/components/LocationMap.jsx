import { useEffect, useMemo, useState } from "react";

function parseNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function storageKey(address, city, country, lat, lng) {
  return [
    "casacar-map",
    address || "",
    city || "",
    country || "",
    lat || "",
    lng || ""
  ].join("|");
}

export default function LocationMap({ city, country, address, lat, lng }) {
  const hasCoords = parseNumber(lat) !== null && parseNumber(lng) !== null;
  const key = useMemo(() => storageKey(address, city, country, lat, lng), [address, city, country, lat, lng]);

  const [zoom, setZoom] = useState(15);
  const [centerLat, setCenterLat] = useState(parseNumber(lat));
  const [centerLng, setCenterLng] = useState(parseNumber(lng));
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        setZoom(15);
        setCenterLat(parseNumber(lat));
        setCenterLng(parseNumber(lng));
        setManualMode(false);
        return;
      }
      const saved = JSON.parse(raw);
      setZoom(Number(saved.zoom || 15));
      setCenterLat(parseNumber(saved.centerLat) ?? parseNumber(lat));
      setCenterLng(parseNumber(saved.centerLng) ?? parseNumber(lng));
      setManualMode(!!saved.manualMode);
    } catch {
      setZoom(15);
      setCenterLat(parseNumber(lat));
      setCenterLng(parseNumber(lng));
      setManualMode(false);
    }
  }, [key, lat, lng]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({
        zoom,
        centerLat,
        centerLng,
        manualMode
      }));
    } catch {}
  }, [key, zoom, centerLat, centerLng, manualMode]);

  useEffect(() => {
    if (!manualMode) {
      setCenterLat(parseNumber(lat));
      setCenterLng(parseNumber(lng));
    }
  }, [lat, lng, manualMode]);

  function changeZoom(delta) {
    setZoom((z) => Math.max(2, Math.min(19, z + delta)));
  }

  function recenter() {
    setCenterLat(parseNumber(lat));
    setCenterLng(parseNumber(lng));
    setZoom(15);
    setManualMode(false);
  }

  function pan(dLat, dLng) {
    if (centerLat === null || centerLng === null) return;
    setCenterLat(centerLat + dLat);
    setCenterLng(centerLng + dLng);
    setManualMode(true);
  }

  const titleText = [address, city, country].filter(Boolean).join(", ") || "Sin ubicación";

  const src = useMemo(() => {
    if (centerLat !== null && centerLng !== null) {
      const size = Math.max(0.0025, 1 / Math.pow(2, zoom - 8));
      const left = centerLng - size;
      const right = centerLng + size;
      const top = centerLat + size;
      const bottom = centerLat - size;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${centerLat}%2C${centerLng}`;
    }
    return "https://www.openstreetmap.org/export/embed.html?bbox=-82,-45,82,45&layer=mapnik";
  }, [centerLat, centerLng, zoom]);

  const openUrl = useMemo(() => {
    if (centerLat !== null && centerLng !== null) {
      return `https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}#map=${zoom}/${centerLat}/${centerLng}`;
    }
    const q = encodeURIComponent(titleText);
    return `https://www.openstreetmap.org/search?query=${q}`;
  }, [centerLat, centerLng, zoom, titleText]);

  return (
    <div style={styles.wrap}>
      <div style={styles.head}>
        <strong>Ubicación</strong>
        <div style={styles.actions}>
          <button type="button" onClick={recenter} style={styles.linkBtn}>Recentrar</button>
          <a href={openUrl} target="_blank" rel="noreferrer" style={styles.link}>Abrir mapa</a>
        </div>
      </div>

      <div style={styles.caption}>{titleText}</div>

      <div style={styles.mapBox}>
        <iframe
          title="mapa"
          src={src}
          style={styles.frame}
          loading="lazy"
        />

        <div style={styles.controls}>
          <button type="button" onClick={() => changeZoom(1)} style={styles.ctrl}>+</button>
          <button type="button" onClick={() => changeZoom(-1)} style={styles.ctrl}>−</button>
          <button type="button" onClick={() => pan(0.0035, 0)} style={styles.ctrl}>↑</button>
          <div style={styles.row}>
            <button type="button" onClick={() => pan(0, -0.0035)} style={styles.ctrl}>←</button>
            <button type="button" onClick={() => pan(0, 0.0035)} style={styles.ctrl}>→</button>
          </div>
          <button type="button" onClick={() => pan(-0.0035, 0)} style={styles.ctrl}>↓</button>
        </div>
      </div>

      <div style={styles.help}>
        {hasCoords
          ? "El mapa usa las coordenadas guardadas del anuncio. Podés moverlo, hacer zoom y luego re-centrarlo."
          : "Este anuncio todavía no tiene coordenadas exactas. Guardá lat/lng para un centrado perfecto."}
      </div>
    </div>
  );
}

const styles = {
  wrap:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:18,minWidth:0,maxWidth:"100%",overflow:"hidden"},
  head:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"},
  actions:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"},
  caption:{color:"#6b7280",marginBottom:12},
  mapBox:{position:"relative",width:"100%",maxWidth:"100%",overflow:"hidden",borderRadius:12},
  frame:{display:"block",width:"100%",maxWidth:"100%",height:360,border:0,borderRadius:12,background:"#f8fafc"},
  controls:{
    position:"absolute",
    top:12,
    left:12,
    display:"grid",
    gap:6,
    background:"#ffffffee",
    border:"1px solid #d1d5db",
    borderRadius:12,
    padding:8
  },
  row:{display:"flex",gap:6},
  ctrl:{
    border:"1px solid #d1d5db",
    background:"#fff",
    color:"#111827",
    minWidth:38,
    height:38,
    borderRadius:10,
    fontWeight:800,
    cursor:"pointer"
  },
  link:{textDecoration:"none",fontWeight:700,color:"#2563eb"},
  linkBtn:{
    border:"1px solid #d1d5db",
    background:"#fff",
    color:"#111827",
    padding:"8px 10px",
    borderRadius:10,
    fontWeight:700,
    cursor:"pointer"
  },
  help:{fontSize:13,color:"#6b7280",marginTop:10,overflowWrap:"break-word"}
};
