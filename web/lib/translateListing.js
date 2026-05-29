
const TITLE_MAP = {
  retroexcavadora: { en: 'Backhoe loader', es: 'Retroexcavadora', pt: 'Retroescavadeira' },
  camion: { en: 'Truck', es: 'Camión', pt: 'Caminhão' },
  'carro de golf': { en: 'Golf cart', es: 'Carro de golf', pt: 'Carrinho de golfe' },
  casa: { en: 'House', es: 'Casa', pt: 'Casa' },
  casaasa: { en: 'House', es: 'Casa', pt: 'Casa' },
  'casa rep': { en: 'House', es: 'Casa', pt: 'Casa' },
  depto: { en: 'Apartment', es: 'Departamento', pt: 'Apartamento' },
  departamento: { en: 'Apartment', es: 'Departamento', pt: 'Apartamento' },
  ph: { en: 'PH', es: 'PH', pt: 'PH' },
  lancha: { en: 'Boat', es: 'Lancha', pt: 'Lancha' },
  'yate deluxe': { en: 'Deluxe yacht', es: 'Yate Deluxe', pt: 'Iate Deluxe' },
  'yate luxuri': { en: 'Luxury yacht', es: 'Yate Luxury', pt: 'Iate de luxo' },
  farmacia: { en: 'Pharmacy', es: 'Farmacia', pt: 'Farmácia' },
  'ph hermoso': { en: 'Beautiful PH', es: 'PH hermoso', pt: 'PH bonito' },
  'premium apartment with open view': { en: 'Premium apartment with open view', es: 'Departamento premium con vista abierta', pt: 'Apartamento premium com vista aberta' },
  'fully equipped suv ready to transfer': { en: 'Fully equipped SUV ready to transfer', es: 'SUV totalmente equipado listo para transferir', pt: 'SUV totalmente equipado pronto para transferir' },
  'sport boat with updated engine': { en: 'Sport boat with updated engine', es: 'Lancha deportiva con motor actualizado', pt: 'Lancha esportiva com motor atualizado' },
  'tu empresa puede aparecer acá': { en: 'Your company can appear here', es: 'Tu empresa puede aparecer acá', pt: 'Sua empresa pode aparecer aqui' },
  'reservá tu espacio publicitario automático': { en: 'Reserve your automatic ad space', es: 'Reservá tu espacio publicitario automático', pt: 'Reserve seu espaço publicitário automático' },
  'banners para inmobiliarias, concesionarias y servicios': { en: 'Banners for real estate, dealers and services', es: 'Banners para inmobiliarias, concesionarias y servicios', pt: 'Banners para imobiliárias, concessionárias e serviços' },
  'sponsor destacado dentro de cada anuncio': { en: 'Featured sponsor inside each listing', es: 'Sponsor destacado dentro de cada anuncio', pt: 'Patrocinador em destaque dentro de cada anúncio' },
  'impulsá tu marca con mercado pago integrado': { en: 'Boost your brand with integrated Mercado Pago', es: 'Impulsá tu marca con Mercado Pago integrado', pt: 'Impulse sua marca com Mercado Pago integrado' },
  'espacios automáticos con cobro listo': { en: 'Automatic spaces with payments ready', es: 'Espacios automáticos con cobro listo', pt: 'Espaços automáticos com cobrança pronta' },
  'monetización lista para fichas': { en: 'Monetization ready for listing pages', es: 'Monetización lista para fichas', pt: 'Monetização pronta para fichas' },
  'banners premium para marcas': { en: 'Premium banners for brands', es: 'Banners premium para marcas', pt: 'Banners premium para marcas' },
};

const CATEGORY_MAP = {
  Propiedad: { en: 'Property', es: 'Propiedad', pt: 'Imóvel' },
  Auto: { en: 'Car', es: 'Auto', pt: 'Carro' },
  Moto: { en: 'Motorcycle', es: 'Moto', pt: 'Moto' },
  'Camión': { en: 'Truck', es: 'Camión', pt: 'Caminhão' },
  'Náutica': { en: 'Nautical', es: 'Náutica', pt: 'Náutica' },
  Maquinaria: { en: 'Machinery', es: 'Maquinaria', pt: 'Maquinário' },
  Servicio: { en: 'Service', es: 'Servicio', pt: 'Serviço' },
  'Carros de golf / seguridad': { en: 'Golf / security carts', es: 'Carros de golf / seguridad', pt: 'Carrinhos de golfe / segurança' },
  Turismo: { en: 'Tourism', es: 'Turismo', pt: 'Turismo' },
};

const SUBTYPE_MAP = {
  Departamento: { en: 'Apartment', es: 'Departamento', pt: 'Apartamento' },
  Casa: { en: 'House', es: 'Casa', pt: 'Casa' },
  PH: { en: 'PH', es: 'PH', pt: 'PH' },
  Quinta: { en: 'Country house', es: 'Quinta', pt: 'Casa de campo' },
  'Local comercial': { en: 'Commercial space', es: 'Local comercial', pt: 'Loja comercial' },
  Campo: { en: 'Field', es: 'Campo', pt: 'Campo' },
  Cochera: { en: 'Garage', es: 'Cochera', pt: 'Garagem' },
  Consultorio: { en: 'Office suite', es: 'Consultorio', pt: 'Consultório' },
  'Fondo de comercio': { en: 'Business for sale', es: 'Fondo de comercio', pt: 'Fundo de comércio' },
  Galpón: { en: 'Warehouse', es: 'Galpón', pt: 'Galpão' },
  Hotel: { en: 'Hotel', es: 'Hotel', pt: 'Hotel' },
  Local: { en: 'Store', es: 'Local', pt: 'Loja' },
  'Negocio especial': { en: 'Special business', es: 'Negocio especial', pt: 'Negócio especial' },
  Oficina: { en: 'Office', es: 'Oficina', pt: 'Escritório' },
  Semipiso: { en: 'Semi-floor apartment', es: 'Semipiso', pt: 'Semipiso' },
  Terreno: { en: 'Land', es: 'Terreno', pt: 'Terreno' },
  Lancha: { en: 'Boat', es: 'Lancha', pt: 'Lancha' },
  Yate: { en: 'Yacht', es: 'Yate', pt: 'Iate' },
  Chasis: { en: 'Chassis', es: 'Chasis', pt: 'Chassi' },
  Retroexcavadora: { en: 'Backhoe loader', es: 'Retroexcavadora', pt: 'Retroescavadeira' },
};

function normalize(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function translateTitle(value = '', language = 'es') {
  const key = normalize(value);
  return TITLE_MAP[key]?.[language] || TITLE_MAP[key]?.es || value || '';
}

export function translateCategory(value = '', language = 'es') {
  return CATEGORY_MAP[value]?.[language] || CATEGORY_MAP[value]?.es || value || '';
}

export function translateSubtype(value = '', language = 'es') {
  return SUBTYPE_MAP[value]?.[language] || SUBTYPE_MAP[value]?.es || value || '';
}

export function translateLocationPart(value = '', language = 'es') {
  const map = {
    'Estados Unidos': { en: 'United States', es: 'Estados Unidos', pt: 'Estados Unidos' },
    'México': { en: 'Mexico', es: 'México', pt: 'México' },
    'Brasil': { en: 'Brazil', es: 'Brasil', pt: 'Brasil' },
    'Santa Fe': { en: 'Santa Fe', es: 'Santa Fe', pt: 'Santa Fe' },
    'Las Toninas': { en: 'Las Toninas', es: 'Las Toninas', pt: 'Las Toninas' },
    'Municipio de Santo Tomé': { en: 'Santo Tomé Municipality', es: 'Municipio de Santo Tomé', pt: 'Município de Santo Tomé' },
  };
  return map[value]?.[language] || map[value]?.es || value || '';
}


export function translateSlotLabel(value = '', language = 'es') {
  const map = {
    'Home superior': { en: 'Home top', es: 'Home superior', pt: 'Home superior' },
    'Home media': { en: 'Home middle', es: 'Home media', pt: 'Home do meio' },
    'Buscar sidebar': { en: 'Search sidebar', es: 'Buscar sidebar', pt: 'Barra lateral da busca' },
    'Ficha de anuncio': { en: 'Listing page', es: 'Ficha de anuncio', pt: 'Página do anúncio' },
    'Pie global': { en: 'Global footer', es: 'Pie global', pt: 'Rodapé global' },
  };
  return map[value]?.[language] || map[value]?.es || value || '';
}
