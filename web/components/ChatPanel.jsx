import { useEffect, useState } from "react";

export default function ChatPanel({ listingId }) {
  const [messages, setMessages] = useState([]);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/messages?listing_id=${listingId}`)
      .then((r) => r.json())
      .then((d) => setMessages(Array.isArray(d) ? d : []))
      .catch(() => setMessages([]));
  }, [listingId]);

  async function sendMessage(e) {
    e.preventDefault();
    const res = await fetch("/api/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ listing_id: listingId, sender_name: senderName, sender_email: senderEmail, body })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "No se pudo enviar");
    setMessages((prev) => [data, ...prev]);
    setBody("");
  }

  return (
    <section style={styles.box}>
      <h2 style={{marginTop:0}}>Chat comprador-vendedor</h2>
      <form onSubmit={sendMessage} style={styles.form}>
        <input style={styles.input} value={senderName} onChange={(e)=>setSenderName(e.target.value)} placeholder="Tu nombre" required />
        <input style={styles.input} value={senderEmail} onChange={(e)=>setSenderEmail(e.target.value)} placeholder="Tu email" required />
        <textarea style={styles.textarea} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Escribí tu mensaje" required />
        <button type="submit" style={styles.button}>Enviar</button>
      </form>
      <div style={styles.list}>
        {messages.map((m) => (
          <div key={m.id} style={styles.msg}>
            <div style={styles.head}>{m.sender_name || m.sender_email}</div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  box:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:18},
  form:{display:"grid",gap:10},
  input:{padding:"14px 16px",border:"1px solid #d1d5db",borderRadius:12,fontSize:16},
  textarea:{padding:"14px 16px",border:"1px solid #d1d5db",borderRadius:12,fontSize:16,minHeight:120},
  button:{background:"#0f172a",color:"#fff",border:"none",padding:"14px 18px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  list:{display:"grid",gap:10,marginTop:16},
  msg:{border:"1px solid #e5e7eb",borderRadius:12,padding:12},
  head:{fontWeight:800,marginBottom:6}
};
