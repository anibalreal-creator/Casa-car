export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" style={styles.wrap}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} style={styles.item}>
          {item.href ? <a href={item.href} style={styles.link}>{item.label}</a> : <span style={styles.current}>{item.label}</span>}
          {index < items.length - 1 ? <span style={styles.sep}>/</span> : null}
        </span>
      ))}
    </nav>
  );
}

const styles = {
  wrap: { display:'flex', flexWrap:'wrap', gap:8, color:'#64748b', fontSize:13, margin:'0 0 10px 0', maxWidth:'100%', minWidth:0, overflow:'hidden' },
  item: { display:'inline-flex', gap:8, alignItems:'center', minWidth:0, maxWidth:'100%' },
  link: { color:'#2563eb', textDecoration:'none', fontWeight:700, maxWidth:'100%', overflowWrap:'anywhere', wordBreak:'break-word' },
  current: { color:'#0f172a', fontWeight:800, maxWidth:'100%', overflowWrap:'anywhere', wordBreak:'break-word' },
  sep: { color:'#94a3b8' }
};
