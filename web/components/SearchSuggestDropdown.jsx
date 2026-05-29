export default function SearchSuggestDropdown({ open, suggestions = [], onPick }) {
  if (!open || !suggestions.length) return null;

  return (
    <div style={styles.box}>
      {suggestions.map((item, i) => (
        <button
          key={item.key || i}
          type="button"
          onClick={() => onPick(item)}
          style={styles.item}
        >
          <div style={styles.title}>{item.label}</div>
          <div style={styles.meta}>{item.meta}</div>
        </button>
      ))}
    </div>
  );
}

const styles = {
  box:{
    position:"absolute",
    top:"calc(100% + 8px)",
    left:0,
    right:0,
    background:"#fff",
    border:"1px solid #e5e7eb",
    borderRadius:16,
    boxShadow:"0 16px 36px rgba(15,23,42,.12)",
    overflow:"hidden",
    zIndex:50
  },
  item:{
    width:"100%",
    border:"none",
    background:"#fff",
    textAlign:"left",
    padding:"12px 14px",
    cursor:"pointer",
    borderBottom:"1px solid #f1f5f9"
  },
  title:{fontWeight:800,color:"#111827"},
  meta:{fontSize:13,color:"#6b7280",marginTop:2}
};
