
const items = [
  { title: "Propiedades", text: "Casas, departamentos, terrenos, oficinas y alquiler temporario." },
  { title: "Vehículos", text: "Autos, motos, camiones y maquinaria en un mismo marketplace." },
  { title: "Náutica", text: "Yates, lanchas, veleros y experiencias náuticas premium." },
  { title: "Turismo", text: "Hoteles, cabañas, excursiones y alquileres vacacionales." },
];

export default function VerticalCategories() {
  return (
    <section style={styles.section}>
      <div style={styles.eyebrow}>CATEGORÍAS</div>
      <h2 style={styles.title}>Explorá el marketplace por verticales</h2>
      <div style={styles.grid}>{items.map((item)=> (
        <article key={item.title} style={styles.card}>
          <h3 style={styles.h3}>{item.title}</h3>
          <p style={styles.text}>{item.text}</p>
          <a href={`/buscar?q=${encodeURIComponent(item.title)}`} style={styles.link}>Explorar</a>
        </article>
      ))}</div>
    </section>
  );
}
const styles={
  section:{padding:"16px 0 26px"},
  eyebrow:{display:"inline-block",fontSize:12,fontWeight:900,letterSpacing:".12em",color:"#4338ca",background:"#eef2ff",padding:"8px 10px",borderRadius:999,marginBottom:14},
  title:{fontSize:46,margin:"0 0 18px 0",letterSpacing:"-.03em"},
  grid:{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:16},
  card:{background:"#fff",border:"1px solid #ececf3",borderRadius:22,padding:22,minHeight:190,display:"flex",flexDirection:"column",justifyContent:"space-between"},
  h3:{margin:"0 0 10px 0",fontSize:24},
  text:{margin:0,color:"#6b7280",lineHeight:1.5},
  link:{display:"inline-block",marginTop:18,textDecoration:"none",background:"#f3f4f6",color:"#111827",padding:"10px 14px",borderRadius:999,fontWeight:800,alignSelf:"flex-start"}
};
