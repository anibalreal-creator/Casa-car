import Link from 'next/link';
import GlobalHeader from '../components/GlobalHeader';
import FooterBlueBar from '../components/FooterBlueBar';
import SeoHead from '../components/SeoHead';
import SearchRequestForm from '../components/SearchRequestForm';

export default function PedidoPage() {
  return (
    <div style={styles.page}>
      <SeoHead
        title="Pedido personalizado | Casa-Car"
        description="Deja tu pedido de busqueda con presupuesto, zonas y datos de contacto para recibir una respuesta personalizada de Casa-Car."
        image="/casa-car-logo.png"
        url="/pedido"
      />
      <GlobalHeader />
      <main style={styles.wrap}>
        <div style={styles.top}>
          <Link href="/" style={styles.back}>Volver al inicio</Link>
          <h1 style={styles.title}>Pedido personalizado</h1>
          <p style={styles.subtitle}>
            Si no encontrás exactamente lo que buscás, dejá los datos y te ayudamos a revisar opciones.
          </p>
        </div>
        <SearchRequestForm />
      </main>
      <FooterBlueBar />

      <style jsx>{`
        @media (max-width: 820px) {
          main {
            padding: 18px 12px 32px !important;
          }

          main :global(section) {
            grid-template-columns: 1fr !important;
            padding: 14px !important;
          }

          main :global(form > div) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Arial, sans-serif', color: '#111827' },
  wrap: { maxWidth: 1180, margin: '0 auto', padding: '34px 16px 46px' },
  top: { marginBottom: 18 },
  back: { color: '#2563eb', textDecoration: 'none', fontWeight: 900 },
  title: { margin: '12px 0 8px', fontSize: 48, lineHeight: 1, fontWeight: 900 },
  subtitle: { margin: 0, color: '#64748b', fontSize: 18, lineHeight: 1.45, maxWidth: 760 },
};
