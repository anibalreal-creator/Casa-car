
export default function StarRating({ value = 0, count = 0, size = 16, showCount = true, compact = false }) {
  const safeValue = Number(value || 0);
  const full = Math.floor(safeValue);
  const hasHalf = safeValue - full >= 0.5;
  const total = 5;
  const stars = [];
  for (let i = 0; i < total; i += 1) {
    let char = "☆";
    if (i < full) char = "★";
    else if (i === full && hasHalf) char = "⯨";
    stars.push(char);
  }

  return (
    <div style={{ display:"flex", alignItems:"center", gap: compact ? 6 : 8, flexWrap:"wrap" }}>
      <div aria-label={`Calificación ${safeValue} de 5`} style={{ color:"#f59e0b", fontSize:size, lineHeight:1, letterSpacing:1 }}>
        {stars.join(" ")}
      </div>
      <strong style={{ fontSize: compact ? 12 : 14, color:"#111827" }}>{safeValue.toFixed(1)}</strong>
      {showCount ? <span style={{ fontSize: compact ? 12 : 14, color:"#6b7280" }}>({Number(count || 0)} reseñas)</span> : null}
    </div>
  );
}
