import { useLang } from '../context/LanguageContext';

const categories = [
  { names: { es:'Propiedades', en:'Properties', pt:'Imóveis', it:'Immobili', de:'Immobilien', fr:'Immobilier', zh:'房产' }, short: 'P', href: '/buscar?category=Propiedad', desc: { es:'Casas, PH, lotes y departamentos.', en:'Homes, lots and apartments.', pt:'Casas, terrenos e apartamentos.', it:'Case, lotti e appartamenti.', de:'Häuser, Grundstücke und Wohnungen.', fr:'Maisons, terrains et appartements.', zh:'住宅、土地和公寓。' } },
  { names: { es:'Autos', en:'Cars', pt:'Autos', it:'Auto', de:'Autos', fr:'Autos', zh:'汽车' }, short: 'A', href: '/buscar?category=Auto', desc: { es:'Sedanes, SUVs, pickups y premium.', en:'Sedans, SUVs, pickups and premium.', pt:'Sedãs, SUVs, pickups e premium.', it:'Berline, SUV, pickup e premium.', de:'Limousinen, SUVs, Pickups und Premium.', fr:'Berlines, SUV, pick-up et premium.', zh:'轿车、SUV、皮卡和高端车。' } },
  { names: { es:'Motos', en:'Motorcycles', pt:'Motos', it:'Moto', de:'Motorräder', fr:'Motos', zh:'摩托车' }, short: 'M', href: '/buscar?category=Moto', desc: { es:'Urbanas, touring y trabajo.', en:'Urban, touring and work.', pt:'Urbanas, touring e trabalho.', it:'Urbane, touring e lavoro.', de:'Stadt, Touring und Arbeit.', fr:'Urbaines, touring et travail.', zh:'城市、旅行和工作用车。' } },
  { names: { es:'Náutica', en:'Nautical', pt:'Náutica', it:'Nautica', de:'Nautik', fr:'Nautique', zh:'船艇' }, short: 'N', href: '/buscar?category=Náutica', desc: { es:'Lanchas, yates y experiencias.', en:'Boats, yachts and experiences.', pt:'Lanchas, iates e experiências.', it:'Barche, yacht ed esperienze.', de:'Boote, Yachten und Erlebnisse.', fr:'Bateaux, yachts et expériences.', zh:'游艇、快艇和体验。' } },
  { names: { es:'Servicios', en:'Services', pt:'Serviços', it:'Servizi', de:'Dienstleistungen', fr:'Services', zh:'服务' }, short: 'S', href: '/buscar?category=Servicio', desc: { es:'Profesionales y empresas.', en:'Professionals and companies.', pt:'Profissionais e empresas.', it:'Professionisti e aziende.', de:'Profis und Unternehmen.', fr:'Professionnels et entreprises.', zh:'专业人士和企业。' } },
  { names: { es:'Maquinaria', en:'Machinery', pt:'Maquinário', it:'Macchinari', de:'Maschinen', fr:'Machinerie', zh:'机械' }, short: 'M', href: '/buscar?category=Maquinaria', desc: { es:'Campo, obra y logística.', en:'Field, construction and logistics.', pt:'Campo, obra e logística.', it:'Campo, cantiere e logistica.', de:'Feld, Bau und Logistik.', fr:'Champ, chantier et logistique.', zh:'农业、工程和物流。' } },
  { names: { es:'Turismo', en:'Tourism', pt:'Turismo', it:'Turismo', de:'Tourismus', fr:'Tourisme', zh:'旅游' }, short: 'T', href: '/buscar?category=Turismo', desc: { es:'Escapadas y alquiler temporal.', en:'Getaways and short stays.', pt:'Escapadas e aluguel temporário.', it:'Viaggi e affitti brevi.', de:'Kurzreisen und Kurzzeitmiete.', fr:'Escapades et location courte durée.', zh:'度假和短租。' } },
  { names: { es:'Carros de golf / seguridad', en:'Golf / security carts', pt:'Carrinhos de golfe / segurança', it:'Golf / sicurezza', de:'Golf / Sicherheit', fr:'Golf / sécurité', zh:'高尔夫/安保车' }, short: 'C', href: '/buscar?category=Carros%20de%20golf%20%2F%20seguridad', desc: { es:'Movilidad eléctrica y utilitaria.', en:'Electric and utility mobility.', pt:'Mobilidade elétrica e utilitária.', it:'Mobilità elettrica e utilitaria.', de:'Elektrische Nutzmobilität.', fr:'Mobilité électrique et utilitaire.', zh:'电动和工具车辆。' } }
];

export default function CategoryShowcase() {
  const { language, t } = useLang();
  return (
    <section style={{ marginTop: 32 }}>
      <div style={styles.kicker}>{t('categories_kicker', 'CATEGORÍAS')}</div>
      <h2 className="cc-cat-title" style={styles.title}>{t('categories_quick_title', 'Accesos rápidos por categoría')}</h2>
      <div className="cc-cat-grid" style={styles.grid}>
        {categories.map((item, idx) => (
          <a key={item.href} href={item.href} style={styles.card}>
            <div style={{ ...styles.iconWrap, background: idx % 2 === 0 ? '#eef2ff' : '#ecfeff' }}>{item.short}</div>
            <div style={styles.cardTitle}>{item.names[language] || item.names.es}</div>
            <div style={styles.cardText}>{item.desc[language] || item.desc.es}</div>
            <div style={styles.link}>{t('categories_quick_link', 'Entrá rápido a esta vertical')}</div>
          </a>
        ))}
      </div>
      <style jsx>{`
        @media (max-width: 1180px) {
          .cc-cat-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 980px) {
          .cc-cat-title {
            font-size: 26px !important;
          }
          .cc-cat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 640px) {
          .cc-cat-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const styles = {
  kicker: { display: 'inline-block', fontSize: 12, fontWeight: 900, color: '#4f46e5', letterSpacing: '.06em', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 900, color: '#111827', margin: '0 0 18px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 16 },
  card: {
    textDecoration: 'none', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '20px 16px', color: '#111827',
    boxShadow: '0 12px 28px rgba(15,23,42,.04)', minHeight: 170, display: 'flex', flexDirection: 'column'
  },
  iconWrap: { width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, marginBottom: 14 },
  cardTitle: { fontSize: 18, fontWeight: 900, marginBottom: 8, lineHeight: 1.15 },
  cardText: { fontSize: 13, color: '#6b7280', lineHeight: 1.45, marginBottom: 'auto' },
  link: { fontSize: 13, color: '#374151', fontWeight: 700, marginTop: 14 }
};
