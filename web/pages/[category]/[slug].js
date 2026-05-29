import Link from 'next/link';
import GlobalHeader from '../../components/GlobalHeader';
import FooterBlueBar from '../../components/FooterBlueBar';
import ListingCard from '../../components/ListingCard';
import SeoHead from '../../components/SeoHead';
import SeoJsonLd from '../../components/SeoJsonLd';
import { getSupabaseServer } from '../../lib/supabaseServer';
import { buildBreadcrumbJsonLd, buildItemListJsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from '../../lib/seo';
import { getSeoTopicLanding } from '../../lib/seoLandings';

function safeLikeTerm(value = '') {
  return String(value || '').replace(/[,%]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export async function getServerSideProps({ params, res }) {
  const landing = getSeoTopicLanding(params?.category || '', params?.slug || '');
  if (!landing) return { notFound: true };

  let items = [];
  try {
    const supabase = getSupabaseServer();
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .eq('category', landing.category)
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(36);

    const term = safeLikeTerm(landing.city || landing.keyword);
    if (term) {
      const like = `%${term}%`;
      query = query.or(`title.ilike.${like},description.ilike.${like},city.ilike.${like},state.ilike.${like},country.ilike.${like},subtype.ilike.${like}`);
    }

    const { data } = await query;
    items = data || [];
  } catch {}

  res?.setHeader?.('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
  return { props: { landing, items } };
}

export default function TopicSeoLanding({ landing, items }) {
  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: landing.title, href: `/${landing.slug}` },
    { label: landing.keyword },
  ];

  return (
    <div style={styles.page}>
      <SeoHead title={landing.title} description={landing.description} image="/casa-car-logo.png" url={landing.path} />
      <SeoJsonLd data={buildOrganizationJsonLd()} />
      <SeoJsonLd data={buildWebSiteJsonLd()} />
      <SeoJsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <SeoJsonLd data={buildItemListJsonLd(items, landing.path)} />
      <GlobalHeader />
      <main style={styles.wrap}>
        <p style={styles.kicker}>LANDING SEO</p>
        <h1 style={styles.title}>{landing.title}</h1>
        <p style={styles.subtitle}>{landing.description}</p>
        <div style={styles.actions}>
          <Link href={`/buscar?category=${encodeURIComponent(landing.category)}&q=${encodeURIComponent(landing.keyword)}`} style={styles.primary}>Ver resultados completos</Link>
          <Link href="/publicar" style={styles.secondary}>Publicar anuncio</Link>
        </div>
        <section style={styles.grid}>
          {items.length ? items.map((item) => <ListingCard key={item.id} item={item} />) : (
            <div style={styles.empty}>Landing preparada para posicionar. Carga anuncios reales relacionados para acelerar indexacion y conversion.</div>
          )}
        </section>
      </main>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page: { background: '#f5f7fb', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  wrap: { maxWidth: 1320, margin: '0 auto', padding: '30px 16px 52px' },
  kicker: { margin: 0, color: '#1d4ed8', fontSize: 12, fontWeight: 900, letterSpacing: '.14em' },
  title: { margin: '8px 0', fontSize: 42, lineHeight: 1.05, color: '#0f172a' },
  subtitle: { margin: '0 0 18px', color: '#475569', fontSize: 18, maxWidth: 880 },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 },
  primary: { background: '#1d4ed8', color: '#fff', borderRadius: 10, padding: '11px 15px', textDecoration: 'none', fontWeight: 900 },
  secondary: { background: '#fff', color: '#0f172a', border: '1px solid #dbe4f0', borderRadius: 10, padding: '11px 15px', textDecoration: 'none', fontWeight: 900 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,420px))', gap: 18 },
  empty: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, color: '#64748b' },
};
