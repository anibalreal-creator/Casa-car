
import { useMemo, useState } from "react";
import StarRating from "./StarRating";

const emptyForm = { reviewer_name:'', reviewer_email:'', rating:5, comment:'' };

export default function ReviewsSection({ listingId, sellerName, summary, reviews, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const topReviews = useMemo(() => (reviews || []).slice(0, 8), [reviews]);

  async function submitReview(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/reviews', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ listing_id: listingId, ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar la reseña');
      setForm(emptyForm);
      if (onCreated) onCreated(data);
      alert('Reseña enviada');
    } catch (error) {
      alert(error.message || 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>Reputación visible</div>
          <h2 style={styles.title}>Opiniones sobre {sellerName || 'este vendedor'}</h2>
        </div>
        <div style={styles.summaryBox}>
          <StarRating value={summary?.rating_avg || 0} count={summary?.reviews_count || 0} size={20} />
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.left}>
          <h3 style={styles.subtitle}>Últimas reseñas</h3>
          {topReviews?.length ? topReviews.map((review) => (
            <article key={review.id} style={styles.reviewCard}>
              <div style={styles.reviewTop}>
                <strong>{review.reviewer_name || 'Usuario Casa-Car'}</strong>
                <StarRating value={review.rating || 0} count={0} showCount={false} compact />
              </div>
              <p style={styles.reviewComment}>{review.comment || 'Sin comentario'}</p>
              <span style={styles.reviewDate}>{review.created_at ? new Date(review.created_at).toLocaleDateString('es-AR') : ''}</span>
            </article>
          )) : <div style={styles.empty}>Todavía no hay reseñas. Sé el primero en dejar una opinión.</div>}
        </div>

        <div style={styles.right}>
          <h3 style={styles.subtitle}>Dejar reseña</h3>
          <form onSubmit={submitReview} style={styles.form}>
            <input style={styles.input} value={form.reviewer_name} onChange={(e)=>setForm((p)=>({...p,reviewer_name:e.target.value}))} placeholder="Tu nombre" required />
            <input style={styles.input} value={form.reviewer_email} onChange={(e)=>setForm((p)=>({...p,reviewer_email:e.target.value}))} placeholder="Tu email" type="email" />
            <select style={styles.input} value={form.rating} onChange={(e)=>setForm((p)=>({...p,rating:Number(e.target.value)}))}>
              <option value={5}>5 estrellas</option>
              <option value={4}>4 estrellas</option>
              <option value={3}>3 estrellas</option>
              <option value={2}>2 estrellas</option>
              <option value={1}>1 estrella</option>
            </select>
            <textarea style={{...styles.input,minHeight:120,resize:'vertical'}} value={form.comment} onChange={(e)=>setForm((p)=>({...p,comment:e.target.value}))} placeholder="Contá cómo fue tu experiencia" required />
            <button type="submit" disabled={sending} style={styles.button}>{sending ? 'Enviando...' : 'Publicar reseña'}</button>
          </form>
        </div>
      </div>
    </section>
  );
}

const styles = {
  card:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:20,boxShadow:'0 12px 28px rgba(15,23,42,.06)',display:'grid',gap:18},
  header:{display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start',flexWrap:'wrap'},
  kicker:{fontSize:12,fontWeight:900,letterSpacing:.6,color:'#2563eb',textTransform:'uppercase'},
  title:{margin:'6px 0 0',fontSize:28,color:'#111827'},
  summaryBox:{background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:14,padding:'12px 14px'},
  grid:{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:18},
  left:{display:'grid',gap:12},
  right:{display:'grid',gap:12},
  subtitle:{margin:0,fontSize:18,color:'#111827'},
  reviewCard:{border:'1px solid #e5e7eb',borderRadius:14,padding:14,background:'#f8fafc',display:'grid',gap:8},
  reviewTop:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'},
  reviewComment:{margin:0,color:'#334155',lineHeight:1.55},
  reviewDate:{fontSize:12,color:'#64748b',fontWeight:700},
  empty:{padding:16,border:'1px dashed #cbd5e1',borderRadius:14,color:'#64748b',background:'#fff'},
  form:{display:'grid',gap:10},
  input:{width:'100%',border:'1px solid #cbd5e1',borderRadius:12,padding:'12px 14px',fontSize:14,outline:'none'},
  button:{background:'#2563eb',color:'#fff',border:'none',borderRadius:12,padding:'12px 14px',fontWeight:900,cursor:'pointer'}
};
