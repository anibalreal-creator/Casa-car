import { useLang } from "../context/LanguageContext";

const QUICK_ITEMS = {
  es: ['Casas en venta','Alquiler temporal','Miami','Buenos Aires','Salta','Náutica','Autos premium','Servicios'],
  en: ['Homes for sale','Short term rent','Miami','Buenos Aires','Salta','Nautical','Premium cars','Services'],
  pt: ['Casas à venda','Aluguel temporário','Miami','Buenos Aires','Salta','Náutica','Autos premium','Serviços'],
  it: ['Case in vendita','Affitto temporaneo','Miami','Buenos Aires','Salta','Nautica','Auto premium','Servizi'],
  de: ['Häuser zum Verkauf','Kurzzeitmiete','Miami','Buenos Aires','Salta','Nautik','Premium-Autos','Dienstleistungen'],
  fr: ['Maisons à vendre','Location temporaire','Miami','Buenos Aires','Salta','Nautique','Autos premium','Services'],
  zh: ['在售房屋','短租','迈阿密','布宜诺斯艾利斯','萨尔塔','船艇','高端汽车','服务'],
};

export default function HomeQuickSearches() {
  const { language, t } = useLang();
  const items = QUICK_ITEMS[language] || QUICK_ITEMS.es;
  return (
    <section style={{ marginTop: 32 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: '#4f46e5', letterSpacing: '.06em', marginBottom: 8 }}>{t('quick_searches_kicker', 'BÚSQUEDAS RÁPIDAS')}</div>
      <h2 className="cc-quick-title" style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '0 0 18px' }}>{t('quick_searches_title', 'Explorá ideas listas para convertir')}</h2>
      <div className="cc-quick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16 }}>
        {items.map((it) => (
          <a key={it} href="/buscar" style={{ textDecoration: 'none', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '20px 18px', fontWeight: 800, color: '#111827', fontSize: 18, boxShadow: '0 10px 24px rgba(15,23,42,.04)' }}>
            {it}
          </a>
        ))}
      </div>
      <style jsx>{`
        @media (max-width: 980px) {
          .cc-quick-title {
            font-size: 26px !important;
          }
          .cc-quick-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 640px) {
          .cc-quick-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
