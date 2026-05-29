export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} style={styles.btn}>
      Imprimir
    </button>
  );
}
const styles = { btn:{border:"1px solid #d1d5db",background:"#fff",padding:"10px 12px",borderRadius:10,fontWeight:700,cursor:"pointer"} };
