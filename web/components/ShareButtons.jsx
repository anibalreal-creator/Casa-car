export default function ShareButtons({ title, url }) {
  const safeUrl = url || "";
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: title || "Casa-Car", url: safeUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(safeUrl);
        alert("Link copiado");
      }
    } catch (e) {}
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(safeUrl);
      alert("Link copiado");
    } catch (e) {}
  }

  return (
    <>
      <button type="button" style={styles.btn} onClick={share}>Compartir</button>
      <button type="button" style={styles.btn} onClick={copy}>Copiar link</button>
    </>
  );
}
const styles = { btn:{border:"1px solid #d1d5db",background:"#fff",padding:"10px 12px",borderRadius:10,fontWeight:700,cursor:"pointer"} };
