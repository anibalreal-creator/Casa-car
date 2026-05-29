const CATEGORY_ALIASES = {
  propiedad: 'Propiedad',
  propiedades: 'Propiedad',
  inmueble: 'Propiedad',
  inmuebles: 'Propiedad',
  auto: 'Auto',
  autos: 'Auto',
  vehiculo: 'Auto',
  vehiculos: 'Auto',
  vehículo: 'Auto',
  vehículos: 'Auto',
  moto: 'Moto',
  motos: 'Moto',
  motocicleta: 'Moto',
  motocicletas: 'Moto',
  camion: 'Camión',
  camiones: 'Camión',
  'camión': 'Camión',
  'camiónes': 'Camión',
  nautica: 'Náutica',
  'náutica': 'Náutica',
  lanchas: 'Náutica',
  yates: 'Náutica',
  maquinaria: 'Maquinaria',
  maquinas: 'Maquinaria',
  máquinas: 'Maquinaria',
  servicio: 'Servicio',
  'carro de golf / seguridad': 'Carros de golf / seguridad',
  'carros de golf / seguridad': 'Carros de golf / seguridad',
  golf: 'Carros de golf / seguridad',
  seguridad: 'Carros de golf / seguridad',
  servicios: 'Servicio',
  turismo: 'Turismo',
  temporal: 'Turismo',
};

function normalizeBasic(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function normalizeCategory(value = '') {
  const key = normalizeBasic(value);
  return CATEGORY_ALIASES[key] || value || '';
}

export function categoryLabel(value = '') {
  const normalized = normalizeCategory(value);
  const labels = {
    Propiedad: 'Propiedades',
    Auto: 'Autos',
    Moto: 'Motos',
    'Camión': 'Camiones',
    'Náutica': 'Náutica',
    Maquinaria: 'Maquinaria',
    Servicio: 'Servicios',
    'Carros de golf / seguridad': 'Carros de golf / seguridad',
    Turismo: 'Turismo',
  };
  return labels[normalized] || normalized || 'General';
}

export function itemMatchesCategory(item, wanted) {
  if (!wanted) return true;
  const itemCategory = normalizeCategory(item?.category || '');
  const expected = normalizeCategory(wanted);
  if (itemCategory === expected) return true;
  if (expected === 'Carros de golf / seguridad') {
    const subtype = normalizeBasic(item?.subtype || '');
    return itemCategory === 'Carros de golf / seguridad' || (itemCategory === 'Auto' && /golf|seguridad/.test(subtype));
  }
  if (expected === 'Turismo') {
    const subtype = normalizeBasic(item?.subtype || '');
    const listingType = normalizeBasic(item?.listing_type || '');
    return listingType === 'temporal' || ['hotel','cabana','cabaña','experiencia','alquiler temporal'].includes(subtype);
  }
  return false;
}

export const MARKETPLACE_CATEGORIES = [
  { value: 'Propiedad', label: 'Propiedades', slug: 'propiedades', description: 'Casas, departamentos, terrenos, oficinas y alquiler temporario.' },
  { value: 'Auto', label: 'Autos', slug: 'autos', description: 'Autos particulares, pickups, SUVs y oportunidades para compra o venta.' },
  { value: 'Carros de golf / seguridad', label: 'Carros de golf / seguridad', slug: 'golf-seguridad', description: 'Carros eléctricos y utilitarios livianos para golf, countries, vigilancia y logística interna.' },
  { value: 'Moto', label: 'Motos', slug: 'motos', description: 'Motos urbanas, touring, enduro y opciones para trabajo o uso diario.' },
  { value: 'Camión', label: 'Camiones', slug: 'camiones', description: 'Camiones, utilitarios pesados y unidades listas para trabajar.' },
  { value: 'Náutica', label: 'Náutica', slug: 'nautica', description: 'Yates, lanchas, veleros y experiencias náuticas premium.' },
  { value: 'Maquinaria', label: 'Maquinaria', slug: 'maquinaria', description: 'Excavadoras, tractores y equipos para campo, obras y logística.' },
  { value: 'Servicio', label: 'Servicios', slug: 'servicios', description: 'Prestadores, servicios especializados y soluciones para particulares y empresas.' },
  { value: 'Turismo', label: 'Turismo', slug: 'turismo', description: 'Hoteles, cabañas, excursiones y alquileres vacacionales.' },
];
