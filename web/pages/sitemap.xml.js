import { MARKETPLACE_CATEGORIES, categoryLabel } from '../lib/category';
import { getSiteUrl } from '../lib/siteUrl';
import { getSupabaseServer } from '../lib/supabaseServer';
import { getListingSeoPath, xmlEscape } from '../lib/seo';
import { getCategoryLandingPath, SEO_CATEGORY_LANDINGS, SEO_TOPIC_LANDINGS } from '../lib/seoLandings';
import { slugify } from '../lib/slugify';

function isoDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function urlEntry(loc, { lastmod, changefreq = 'weekly', priority = '0.7' } = {}) {
  return [
    '<url>',
    `<loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `<lastmod>${xmlEscape(isoDate(lastmod))}</lastmod>` : '',
    `<changefreq>${changefreq}</changefreq>`,
    `<priority>${priority}</priority>`,
    '</url>',
  ].filter(Boolean).join('');
}

export async function getServerSideProps({ res }) {
  const site = getSiteUrl().replace(/\/+$/, '');
  const urls = new Map();

  const addUrl = (pathOrUrl, options) => {
    const loc = /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${site}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
    if (!urls.has(loc)) urls.set(loc, urlEntry(loc, options));
  };

  addUrl('/', { changefreq: 'daily', priority: '1.0' });
  addUrl('/buscar', { changefreq: 'daily', priority: '0.95' });
  addUrl('/publicidad', { changefreq: 'weekly', priority: '0.75' });
  addUrl('/planes', { changefreq: 'weekly', priority: '0.75' });
  addUrl('/empresas', { changefreq: 'weekly', priority: '0.75' });
  addUrl('/empresa', { changefreq: 'weekly', priority: '0.7' });
  addUrl('/panel-empresas', { changefreq: 'weekly', priority: '0.65' });

  for (const category of MARKETPLACE_CATEGORIES) {
    addUrl(`/buscar?category=${encodeURIComponent(category.value)}`, {
      changefreq: 'daily',
      priority: '0.85',
    });
  }

  for (const landing of SEO_CATEGORY_LANDINGS) {
    addUrl(getCategoryLandingPath(landing), {
      changefreq: 'daily',
      priority: '0.9',
    });
  }

  for (const landing of SEO_TOPIC_LANDINGS) {
    addUrl(`/${landing.categorySlug}/${landing.slug}`, {
      changefreq: 'weekly',
      priority: '0.86',
    });
  }

  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('listings')
      .select('id, title, updated_at, created_at, seo_slug, category, country, city, status')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5000);

    for (const item of data || []) {
      const lastmod = item.updated_at || item.created_at;
      addUrl(getListingSeoPath(item), { lastmod, changefreq: 'daily', priority: item.seo_slug || item.slug ? '0.9' : '0.82' });

      if (item.category && item.country && item.city) {
        addUrl(`/${slugify(categoryLabel(item.category || 'general'))}/${slugify(item.country)}/${slugify(item.city)}`, {
          lastmod,
          changefreq: 'daily',
          priority: '0.8',
        });
      }
    }
  } catch {
    // A static sitemap is still better than returning an error if Supabase is unavailable.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls.values()).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
