import { normalizeCategory } from './category';

const CONTAIN_CATEGORIES = new Set([
  'Auto',
  'Moto',
  'Camión',
  'Náutica',
  'Maquinaria',
  'Carros de golf / seguridad',
  'Servicio',
]);

const COVER_CATEGORIES = new Set([
  'Propiedad',
  'Turismo',
]);

export function getImagePresentation(item = {}) {
  const category = normalizeCategory(item?.category || '');
  const title = `${item?.title || ''} ${item?.subtype || ''}`.toLowerCase();

  if (CONTAIN_CATEGORIES.has(category)) {
    return {
      fit: 'contain',
      background: '#f8fafc',
      position: 'center center',
    };
  }

  if (COVER_CATEGORIES.has(category)) {
    return {
      fit: 'cover',
      background: '#eef2f7',
      position: 'center center',
    };
  }

  if (/auto|moto|camion|camión|nautica|náutica|maquinaria|golf|seguridad|lancha|yate|tractor|excavadora/.test(title)) {
    return {
      fit: 'contain',
      background: '#f8fafc',
      position: 'center center',
    };
  }

  return {
    fit: 'cover',
    background: '#eef2f7',
    position: 'center center',
  };
}
