export default function AuctionCard({ item }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        padding: 15,
        borderRadius: 10,
      }}
    >
      <h3>{item?.title}</h3>

      <div>
        Precio actual: {item?.currency} {item?.current_price}
      </div>

      <div>
        Finaliza: {item?.ends_at || "-"}
      </div>
    </div>
  );
}
