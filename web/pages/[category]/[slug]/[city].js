import GlobalHeader from "../../../components/GlobalHeader";
import FooterBlueBar from "../../../components/FooterBlueBar";
import ListingCard from "../../../components/ListingCard";
import SeoHead from "../../../components/SeoHead";
import SeoJsonLd from "../../../components/SeoJsonLd";
import { getSupabaseServer } from "../../../lib/supabaseServer";
import { categoryLabel, normalizeCategory } from "../../../lib/category";
import { absoluteUrl, buildBreadcrumbJsonLd, buildItemListJsonLd, buildOrganizationJsonLd } from "../../../lib/seo";
import { slugify } from "../../../lib/slugify";

function unslug(text = "") {
  return decodeURIComponent(String(text || "")).replace(/-/g, " ").trim();
}

export async function getServerSideProps({ params, res }) {
  const rawCategory = unslug(params.category);
  const rawCountry = unslug(params.slug);
  const rawCity = unslug(params.city);

  const reserved = ['api', '_next', 'favicon.ico'];
  if (reserved.includes(String(rawCategory || '').toLowerCase())) {
    return { notFound: true };
  }
  if (reserved.includes(String(rawCountry || '').toLowerCase())) {
    return { notFound: true };
  }
  if (reserved.includes(String(rawCity || '').toLowerCase())) {
    return { notFound: true };
  }

  const category = normalizeCategory(rawCategory);
  const country = rawCountry;
  const city = rawCity;
  const supabase = getSupabaseServer();
  let items = [];
  try {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .eq('category', category)
      .ilike('country', country)
      .ilike('city', city)
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(48);
    items = data || [];
  } catch {}
  res?.setHeader?.('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
  return { props: { category, country, city, items } };
}

export default function SeoLocationPage({ category, country, city, items }) {
  const title = `${category} en ${city}, ${country} | Casa-Car`;
  const description = `Encontra ${category.toLowerCase()} en ${city}, ${country}. Anuncios activos, destacados, premium y resultados indexables en Casa-Car.`;
  const pagePath = `/${slugify(categoryLabel(category))}/${slugify(country)}/${slugify(city)}`;
  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: category, href: `/buscar?category=${encodeURIComponent(category)}` },
    { label: country, href: `/buscar?category=${encodeURIComponent(category)}&country=${encodeURIComponent(country)}` },
    { label: city },
  ];
  return (
    <div style={styles.page}>
      <SeoHead title={title} description={description} image="/casa-car-logo.png" url={absoluteUrl(pagePath)} />
      <SeoJsonLd data={buildOrganizationJsonLd()} />
      <SeoJsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <SeoJsonLd data={buildItemListJsonLd(items, pagePath)} />
      <GlobalHeader />
      <main style={styles.wrap}>
        <div style={styles.kicker}>SEO + CRECIMIENTO</div>
        <h1 style={styles.title}>{category} en {city}, {country}</h1>
        <p style={styles.subtitle}>Landing indexable para trafico organico y campanas de performance.</p>
        <div style={styles.grid}>
          {items.length ? items.map((item) => <ListingCard key={item.id} item={item} />) : <div style={styles.empty}>Todavia no hay resultados cargados para esta combinacion SEO.</div>}
        </div>
      </main>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page: { background: '#f5f7fb', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  wrap: { maxWidth: 1320, margin: '0 auto', padding: '28px 16px 48px' },
  kicker: { fontSize: 12, fontWeight: 900, letterSpacing: '.14em', color: '#1d4ed8' },
  title: { fontSize: 46, margin: '8px 0 8px 0' },
  subtitle: { fontSize: 18, color: '#6b7280', margin: '0 0 18px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,420px))', gap: 18 },
  empty: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 18, color: '#6b7280' },
};
