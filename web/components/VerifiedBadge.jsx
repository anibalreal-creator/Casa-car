
export default function VerifiedBadge({ verified, small = false }) {
  if (!verified) return null;
  return <span style={styles.badge(small)}>Vendedor verificado</span>;
}
const styles = {
  badge:(small)=>({display:"inline-block",background:"#0ea5e9",color:"#fff",padding:small?"5px 9px":"6px 10px",borderRadius:999,fontSize:small?11:12,fontWeight:800})
};
