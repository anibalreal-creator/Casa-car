import Head from "next/head";
import { absoluteUrl, trimText } from "../lib/seo";

export default function SeoHead({
  title = "Casa-Car",
  description = "Marketplace global de propiedades, vehiculos, nautica, turismo, maquinaria y servicios.",
  image = "/casa-car-logo.png",
  url = "/",
  type = "website",
  noindex = false,
}) {
  const safeTitle = trimText(title, 82);
  const safeDescription = trimText(description, 165);
  const absoluteImage = absoluteUrl(image);
  const canonical = absoluteUrl(url);

  return (
    <Head>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"} />
      <meta name="theme-color" content="#0f172a" />
      <meta name="application-name" content="Casa-Car" />
      <meta name="apple-mobile-web-app-title" content="Casa-Car" />
      <meta name="format-detection" content="telephone=no" />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Casa-Car" />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:alt" content={safeTitle} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={absoluteImage} />
    </Head>
  );
}
