import AuthBox from "../components/AuthBox";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Casa-Car</h1>
      <p>Marketplace de inmuebles y autos (venta / alquiler) con USD / ARS / BRL.</p>

      <AuthBox />

      <h2 style={{ marginTop: 24 }}>Últimos anuncios</h2>
    </main>
  );
}
