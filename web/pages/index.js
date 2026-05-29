import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import GlobalHeader from '../components/GlobalHeader';
import SearchMarketplaceHero from '../components/SearchMarketplaceHero';
import FooterBlueBar from '../components/FooterBlueBar';
import MarketplaceHomeSections from '../components/MarketplaceHomeSections';
import HomeQuickSearches from '../components/HomeQuickSearches';
import AdsSlot from '../components/AdsSlot';
import PremiumListingsStrip from '../components/PremiumListingsStrip';
import CategoryShowcase from '../components/CategoryShowcase';
import { useLang } from '../context/LanguageContext';
import SeoHead from '../components/SeoHead';
import SeoJsonLd from '../components/SeoJsonLd';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '../lib/seo';

function HeroPromoCard() {
  const { t } = useLang();

  return (
    <aside style={styles.heroPromoUltra}>
      <div style={styles.heroKicker}>CASA-CAR</div>
      <h1 style={styles.heroTitleUltra}>{t('home_left_title', 'Encontrá lo que buscás')}</h1>
      <p style={styles.heroSubtitleUltra}>{t('home_left_subtitle', 'Propiedades, autos y oportunidades reales en un solo lugar.')}</p>

      <div style={styles.heroBadges}>
        <span style={styles.heroBadge}>{t('home_badge_active', '25 anuncios activos')}</span>
        <span style={styles.heroBadgeAlt}>{t('home_badge_global', 'Marketplace global')}</span>
      </div>

      <div style={styles.heroActions}>
        <Link href="/buscar" style={styles.btnPrimary}>{t('home_explore_ads', 'Explorar anuncios')}</Link>
        <Link href="/publicar" style={styles.btnSecondary}>{t('home_publish_free', 'Publicar gratis')}</Link>
      </div>
    </aside>
  );
}

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [listingType, setListingType] = useState('');
  const { t } = useLang();

  function onSubmit(e) {
    e.preventDefault();
    const query = {};
    if (search) query.q = search;
    if (country) query.country = country;
    if (state) query.state = state;
    if (city) query.city = city;
    if (category) query.category = category;
    if (listingType) query.type = listingType;
    router.push({ pathname: '/buscar', query });
  }

  return (
    <div style={styles.page}>
      <SeoHead
        title="Casa-Car | Marketplace global de propiedades, vehiculos, nautica y turismo"
        description="Casa-Car es un marketplace global para publicar, buscar y monetizar propiedades, autos, motos, camiones, maquinaria, nautica, turismo, servicios y carros de golf."
        image="/casa-car-logo.png"
        url="/"
      />
      <SeoJsonLd data={buildOrganizationJsonLd()} />
      <SeoJsonLd data={buildWebSiteJsonLd()} />
      <GlobalHeader />
      <div className="cc-home-wrap" style={styles.wrap}>
        <section className="cc-home-hero-wrap" style={styles.heroWrap}>
          <HeroPromoCard />
          <div style={styles.heroCard}>
            <SearchMarketplaceHero
              search={search} setSearch={setSearch}
              country={country} setCountry={setCountry}
              state={state} setState={setState}
              city={city} setCity={setCity}
              category={category} setCategory={setCategory}
              listingType={listingType} setListingType={setListingType}
              onSubmit={onSubmit}
            />
          </div>
        </section>

        <AdsSlot slot="home_top" title={t('ads_title_top', 'Publicidad premium para empresas')} subtitle={t('ads_subtitle_top', 'Banners destacados para inmobiliarias, concesionarias, turismo y servicios.')} />
        <PremiumListingsStrip />
        <CategoryShowcase />
        <MarketplaceHomeSections />
        <HomeQuickSearches />
        <AdsSlot slot="home_middle" title={t('ads_title_middle', 'Espacios publicitarios automáticos')} subtitle={t('ads_subtitle_middle', 'Panel de empresas + cobro + visibilidad en slots reutilizables.')} />
      </div>
      <FooterBlueBar />

      <style jsx>{`
        @media (max-width: 980px) {
          .cc-home-wrap {
            padding: 18px 12px 36px !important;
          }

          .cc-home-hero-wrap {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { background: '#f5f7fb', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  wrap: { maxWidth: 1400, margin: '0 auto', padding: '32px 16px 48px' },
  heroWrap: { display: 'grid', gridTemplateColumns: 'minmax(320px,360px) minmax(0,1fr)', gap: 24, alignItems: 'stretch', marginBottom: 34 },
  heroPromoUltra: {
    background: 'linear-gradient(180deg,#0f172a 0%, #111827 35%, #1d4ed8 100%)',
    borderRadius: 30,
    padding: 28,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 16,
    minHeight: 360,
    boxShadow: '0 18px 40px rgba(15,23,42,.14)',
  },
  heroKicker: { display: 'inline-block', width: 'fit-content', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 900, fontSize: 12, letterSpacing: '.08em' },
  heroTitleUltra: { fontSize: 44, fontWeight: 900, lineHeight: 1.02, letterSpacing: '-.04em', margin: 0 },
  heroSubtitleUltra: { fontSize: 17, color: '#dbeafe', maxWidth: 320, lineHeight: 1.55, margin: 0 },
  heroBadges: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  heroBadge: { background: '#2563eb', color: '#fff', padding: '8px 12px', borderRadius: 12, fontWeight: 800, fontSize: 13 },
  heroBadgeAlt: { background: 'rgba(255,255,255,.1)', color: '#fff', padding: '8px 12px', borderRadius: 12, fontWeight: 800, fontSize: 13 },
  heroActions: { display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  btnPrimary: { background: '#2563eb', color: '#fff', padding: '13px 16px', borderRadius: 14, fontWeight: 900, textDecoration: 'none' },
  btnSecondary: { background: '#fff', color: '#111827', padding: '13px 16px', borderRadius: 14, fontWeight: 900, textDecoration: 'none' },
  heroCard: { minWidth: 0 },
};
