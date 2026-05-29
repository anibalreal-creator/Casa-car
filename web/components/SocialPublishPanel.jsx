export default function SocialPublishPanel({ title, url }) {
  const encodedUrl = encodeURIComponent(url || "");
  const encodedTitle = encodeURIComponent(title || "Casa-Car");
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "X / Twitter", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  return (
    <div style={styles.box}>
      <div style={styles.head}>Publicación en redes</div>
      <div style={styles.note}>Base lista para compartir cada anuncio en redes.</div>
      <div style={styles.row}>
        {links.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer" style={styles.link}>{link.label}</a>
        ))}
      </div>
    </div>
  );
}

const styles = {
  box:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:16},
  head:{fontWeight:800,fontSize:18,marginBottom:8},
  note:{color:"#6b7280",marginBottom:12},
  row:{display:"flex",gap:10,flexWrap:"wrap"},
  link:{textDecoration:"none",background:"#0f172a",color:"#fff",padding:"10px 12px",borderRadius:10,fontWeight:700}
};
