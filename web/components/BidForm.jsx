import { useState } from "react";

export default function BidForm({ auctionId, onCreated = () => {} }) {
  const [amount, setAmount] = useState("");

  async function bid(e) {
    e.preventDefault();

    const res = await fetch("/api/auctions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auction_id: auctionId,
        amount: amount,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "No se pudo ofertar");
      return;
    }

    setAmount("");
    onCreated();
    alert("Oferta enviada");
  }

  return (
    <form onSubmit={bid} style={{ display: "flex", gap: 10 }}>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Oferta"
      />
      <button type="submit">Ofertar</button>
    </form>
  );
}
