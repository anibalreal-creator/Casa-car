import { categoryLabel, normalizeCategory } from './category';
import { slugify } from './slugify';

export const SEO_CATEGORY_LANDINGS = [
  {
    slug: 'autos',
    categoryInput: 'autos',
    title: 'Autos usados y nuevos en Casa-Car',
    description: 'Compra, venta y oportunidades de autos con filtros por marca, modelo, precio, ubicacion y publicaciones premium.',
    intro: 'Autos por marca, ciudad y precio, con contacto directo y anuncios destacados.',
  },
  {
    slug: 'propiedades',
    categoryInput: 'propiedades',
    title: 'Propiedades en venta y alquiler en Casa-Car',
    description: 'Casas, departamentos, terrenos, oficinas y alquileres temporarios con busqueda por ciudad, precio y caracteristicas.',
    intro: 'Propiedades indexables por ciudad y operacion para captar busquedas organicas.',
  },
  {
    slug: 'turismo',
    categoryInput: 'turismo',
    title: 'Turismo, alojamientos y experiencias en Casa-Car',
    description: 'Hoteles, cabanas, departamentos temporarios, excursiones, pesca, buceo, navegacion y alquileres turisticos.',
    intro: 'Turismo estilo Booking y Airbnb, con disponibilidad, servicios, mapa, reviews y contacto directo.',
  },
  {
    slug: 'nautica',
    categoryInput: 'nautica',
    title: 'Nautica, lanchas y yates en Casa-Car',
    description: 'Yates, lanchas, veleros, motos de agua y experiencias nauticas con anuncios premium y contacto directo.',
    intro: 'Nautica premium con fichas tecnicas, ubicacion y oportunidades para compra, venta o alquiler.',
  },
  {
    slug: 'motos',
    categoryInput: 'motos',
    title: 'Motos usadas y nuevas en Casa-Car',
    description: 'Motos urbanas, touring, enduro y unidades de trabajo con filtros por marca, precio y ubicacion.',
    intro: 'Motos para uso diario, aventura o trabajo con publicaciones verificables.',
  },
  {
    slug: 'camiones',
    categoryInput: 'camiones',
    title: 'Camiones y utilitarios en Casa-Car',
    description: 'Camiones, utilitarios pesados, flotas y unidades listas para trabajar.',
    intro: 'Camiones y utilitarios para empresas, logistica y transporte.',
  },
  {
    slug: 'maquinaria',
    categoryInput: 'maquinaria',
    title: 'Maquinaria agricola y vial en Casa-Car',
    description: 'Tractores, excavadoras, equipos de obra, campo y logistica con anuncios premium.',
    intro: 'Maquinaria para campo, obra e industria con busqueda por zona y tipo de equipo.',
  },
  {
    slug: 'servicios',
    categoryInput: 'servicios',
    title: 'Servicios profesionales en Casa-Car',
    description: 'Prestadores, servicios especializados y soluciones para particulares, empresas y turismo.',
    intro: 'Servicios conectados al marketplace para completar la experiencia de compra, alquiler y viaje.',
  },
];

export const SEO_TOPIC_LANDINGS = [
  { categorySlug: 'autos', slug: 'bmw', title: 'Autos BMW en Casa-Car', query: 'bmw' },
  { categorySlug: 'autos', slug: 'toyota', title: 'Autos Toyota en Casa-Car', query: 'toyota' },
  { categorySlug: 'autos', slug: 'pickups', title: 'Pickups en Casa-Car', query: 'pickup' },
  { categorySlug: 'propiedades', slug: 'venta-santa-fe', title: 'Propiedades en venta en Santa Fe', query: 'venta santa fe', city: 'Santa Fe' },
  { categorySlug: 'propiedades', slug: 'alquiler-temporario', title: 'Alquiler temporario en Casa-Car', query: 'alquiler temporario' },
  { categorySlug: 'turismo', slug: 'cabanas', title: 'Cabanas y alojamientos en Casa-Car', query: 'cabana' },
  { categorySlug: 'turismo', slug: 'experiencias', title: 'Experiencias turisticas en Casa-Car', query: 'experiencia' },
  { categorySlug: 'turismo', slug: 'pesca-buceo-navegacion', title: 'Pesca, buceo y navegacion en Casa-Car', query: 'pesca buceo navegacion' },
  { categorySlug: 'nautica', slug: 'yates-miami', title: 'Yates y nautica en Miami', query: 'yate miami', city: 'Miami' },
  { categorySlug: 'nautica', slug: 'lanchas', title: 'Lanchas en Casa-Car', query: 'lancha' },
];

export function getSeoCategoryLanding(categorySlug = '') {
  const clean = slugify(categorySlug);
  return SEO_CATEGORY_LANDINGS.find((landing) => landing.slug === clean) || null;
}

export function getSeoTopicLanding(categorySlug = '', topicSlug = '') {
  const categoryLanding = getSeoCategoryLanding(categorySlug);
  if (!categoryLanding) return null;

  const cleanTopic = slugify(topicSlug);
  const preset = SEO_TOPIC_LANDINGS.find((landing) => landing.categorySlug === categoryLanding.slug && landing.slug === cleanTopic);
  const keyword = (preset?.query || cleanTopic.replace(/-/g, ' ')).trim();
  const category = normalizeCategory(categoryLanding.categoryInput);

  return {
    ...categoryLanding,
    ...(preset || {}),
    category,
    topicSlug: cleanTopic,
    keyword,
    path: `/${categoryLanding.slug}/${cleanTopic}`,
    title: preset?.title || `${categoryLabel(category)} ${keyword} en Casa-Car`,
    description: preset?.description || `${categoryLabel(category)} relacionados con ${keyword} en Casa-Car. Resultados indexables con ubicacion, precio, premium y contacto directo.`,
  };
}

export function getCategoryLandingPath(landing) {
  return `/${landing.slug}`;
}

export function getCategoryValue(landing) {
  return normalizeCategory(landing.categoryInput);
}
