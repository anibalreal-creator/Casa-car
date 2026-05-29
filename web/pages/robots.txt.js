import { getSiteUrl } from "../lib/siteUrl";

export async function getServerSideProps({ res }) {
  const site = getSiteUrl();
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.write(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /admin-completo
Disallow: /dashboard
Disallow: /mis-anuncios
Disallow: /favoritos
Disallow: /perfil
Disallow: /login
Disallow: /ingresar
Disallow: /auth/
Disallow: /publicidad/panel

Sitemap: ${site}/sitemap.xml`);
  res.end();
  return { props: {} };
}

export default function Robots() {
  return null;
}
