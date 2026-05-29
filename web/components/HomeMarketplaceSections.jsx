
import ListingCard from "./ListingCard";

export default function HomeMarketplaceSections({ items = [] }) {
  const active = items.filter((x) => x?.status !== "paused");
  const featured = active.filter((x) => x?.highlighted || x?.is_premium).slice(0, 4);
  const live = active.slice(0, 4);
  const turismo = active.filter((x) => String(x?.category || "").toLowerCase().includes("turismo") || String(x?.subtype || "").toLowerCase().includes("hotel") || String(x?.listing_type || "") === "temporal").slice(0, 4);

  return (
    <>
      <Section eyebrow="DESTACADOS DE HOY" title="Anuncios con más potencial visual para la portada" items={featured.length ? featured : live} />
      <Section eyebrow="NUEVOS PUBLICADOS" title="El marketplace se ve vivo cuando la home muestra actividad real" items={live} />
      <section style={styles.tourismWrap}>
        <div>
          <div style={styles.eyebrow}>TURISMO Y EXPERIENCIAS</div>
          <h2 style={styles.big}>Escapadas, alojamientos y experiencias para darle otra dimensión a Casa-Car</h2>
          <p style={styles.text}>Este bloque deja visible que el proyecto no es solo inmobiliario: también puede crecer como mini-Airbnb, marketplace de excursiones y alquiler vacacional.</p>
          <div style={styles.tags}>
            <span style={styles.tag}>Alojamientos</span>
            <span style={styles.tag}>Excursiones</span>
            <span style={styles.tag}>Náutica turística</span>
            <span style={styles.tag}>Alquiler temporal</span>
          </div>
        </div>
        <div style={styles.points}>
          <Point title="Publicación simple" text="Subí un anuncio completo con fotos, ubicación inteligente y ficha técnica." />
          <Point title="Alcance global" text="Preparado para publicar propiedades, vehículos, náutica y turismo en cualquier país." />
          <Point title="Contacto directo" text="Los interesados llegan rápido por WhatsApp y por la consulta del anuncio." />
        </div>
      </section>
      {turismo.length ? <Section eyebrow="TURISMO EN CASA-CAR" title="Alojamientos y alquiler temporario listos para crecer" items={turismo} /> : null}
    </>
  );
}

function Section({ eyebrow, title, items }) {
  return (
    <section style={styles.section}>
      <div style={styles.eyebrow}>{eyebrow}</div>
      <h2 style={styles.title}>{title}</h2>
      <div style={styles.grid}>{items.map((item) => <ListingCard key={item.id} item={item} />)}</div>
    </section>
  );
}

function Point({ title, text }) {
  return <div style={styles.point}><h3 style={styles.pointTitle}>{title}</h3><p style={styles.pointText}>{text}</p></div>;
}

const styles = {
  section:{padding:"14px 0 30px"},
  eyebrow:{display:"inline-block",fontSize:12,fontWeight:900,letterSpacing:".12em",color:"#4338ca",background:"#eef2ff",padding:"8px 10px",borderRadius:999,marginBottom:14},
  title:{fontSize:48,margin:"0 0 18px 0",letterSpacing:"-.04em"},
  grid:{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:18},
  tourismWrap:{display:"grid",gridTemplateColumns:"1.05fr .95fr",gap:24,alignItems:"center",padding:"30px 0",background:"linear-gradient(180deg,#faf8ff,#f8fafc)",borderRadius:28,paddingInline:24,marginBottom:28},
  big:{fontSize:52,letterSpacing:"-.05em",lineHeight:0.98,margin:"0 0 14px 0"},
  text:{fontSize:18,color:"#6b7280",lineHeight:1.6,margin:"0 0 14px 0"},
  tags:{display:"flex",gap:8,flexWrap:"wrap"},
  tag:{background:"#fff",border:"1px solid #e5e7eb",padding:"9px 12px",borderRadius:999,fontWeight:800},
  points:{display:"grid",gap:14},
  point:{background:"#fff",border:"1px solid #ececf3",borderRadius:20,padding:18},
  pointTitle:{margin:"0 0 8px 0",fontSize:22},
  pointText:{margin:0,color:"#6b7280",lineHeight:1.5}
};
