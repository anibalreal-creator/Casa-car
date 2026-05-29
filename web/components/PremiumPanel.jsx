
export default function PremiumPanel({ item, onTogglePremium }) {
  return (
    <div style={{background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:14,padding:14}}>
      <h3>Panel premium</h3>
      <p>{item.is_premium ? "Premium activo" : "Publicación estándar"}</p>
      <button onClick={onTogglePremium}>
        {item.is_premium ? "Quitar premium" : "Activar premium"}
      </button>
    </div>
  );
}
