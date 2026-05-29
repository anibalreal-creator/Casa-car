import { useEffect, useState } from "react";
import AuctionCard from "../components/AuctionCard";
import BidForm from "../components/BidForm";
import FooterBlueBar from "../components/FooterBlueBar";

export default function SubastasPage() {
  const [items, setItems] = useState([]);
  const reload = () => fetch("/api/auctions").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([]));
  useEffect(() => { reload(); }, []);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Sistema de subastas</h1>
        <p style={styles.subtitle}>Ofertá por anuncios especiales y seguí el precio actual.</p>
        <div style={styles.grid}>
          {items.map((item) => (
            <div key={item.id}>
              <AuctionCard item={item} />
              <BidForm auctionId={item.id} onCreated={reload} />
            </div>
          ))}
        </div>
      </div>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",padding:"28px 16px",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:1200,margin:"0 auto"},
  title:{fontSize:46,margin:"0 0 6px 0"},
  subtitle:{color:"#6b7280",marginBottom:18},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18}
};
