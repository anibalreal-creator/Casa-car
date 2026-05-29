import { useMemo, useState } from "react";

export default function SmartSearchBox({ items = [], onPick }) {
  const [q, setQ] = useState("");

  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return items.filter((item) => {
      return [item.title, item.city, item.country, item.zone, item.address, item.category, item.subtype]
        .some((v) => String(v || "").toLowerCase().includes(s));
    }).slice(0, 6);
  }, [q, items]);

  return (
    <div style={styles.wrap}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Búsqueda inteligente: ciudad, zona, dirección, categoría..."
        style={styles.input}
      />
      {suggestions.length ? (
        <div style={styles.box}>
          {suggestions.map((item) => (
            <button key={item.id} type="button" onClick={() => onPick?.(item)} style={styles.item}>
              <strong>{item.title}</strong>
              <span>{item.city}, {item.country}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  wrap:{position:"relative"},
  input:{width:"100%",padding:"14px 16px",border:"1px solid #d1d5db",borderRadius:12,fontSize:16,background:"#fff"},
  box:{position:"absolute",left:0,right:0,top:"calc(100% + 8px)",background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,boxShadow:"0 10px 24px rgba(0,0,0,.08)",overflow:"hidden",zIndex:30},
  item:{display:"grid",gap:4,width:"100%",textAlign:"left",padding:"12px 14px",border:"none",background:"#fff",cursor:"pointer"}
};
