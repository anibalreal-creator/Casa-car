export default function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={styles.image} />
      <div style={styles.lineLg} />
      <div style={styles.lineMd} />
      <div style={styles.lineSm} />
    </div>
  );
}

const base = { background:'linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 37%,#e5e7eb 63%)', backgroundSize:'400% 100%', animation:'pulse 1.4s ease infinite', borderRadius:12 };
const styles = {
  card:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:14,display:'grid',gap:12},
  image:{...base,height:220},
  lineLg:{...base,height:24,width:'80%'},
  lineMd:{...base,height:18,width:'45%'},
  lineSm:{...base,height:14,width:'60%'}
};
