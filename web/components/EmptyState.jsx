export default function EmptyState({ title = 'Sin resultados', text = 'Probá ajustando filtros o creando un nuevo aviso.' }) {
  return (
    <div style={styles.box}>
      <div style={styles.emoji}>🔎</div>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.text}>{text}</p>
    </div>
  );
}

const styles = {
  box:{background:'#fff',border:'1px dashed #cbd5e1',borderRadius:20,padding:'28px 20px',textAlign:'center'},
  emoji:{fontSize:34,marginBottom:10},
  title:{margin:'0 0 8px 0',fontSize:22,color:'#0f172a'},
  text:{margin:0,color:'#64748b'}
};
