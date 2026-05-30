import Document, { Html, Head, Main, NextScript } from 'next/document';

const casaCarResponsiveFix = `
/* CASA-CAR SAFE FIX - filtros home/buscar no cortados */
html, body { overflow-x: hidden; }
* { box-sizing: border-box; }

/* Buscador principal: permite que los filtros bajen de linea en pantallas chicas */
.search-panel,
.searchBox,
.search-box,
.hero-search,
.home-search,
.search-card,
.filters-card,
.filtersPanel,
.filters-panel,
.filterBar,
.filter-bar,
.searchFilters,
.search-filters,
.quickSearch,
.quick-search,
[class*="search"],
[class*="Search"] {
  max-width: 100%;
}

/* Contenedores de campos */
.search-panel form,
.searchBox form,
.search-box form,
.hero-search form,
.home-search form,
.search-card form,
.filters-card form,
.filterBar,
.filter-bar,
.searchFilters,
.search-filters,
.quickSearch,
.quick-search,
[class*="filtersRow"],
[class*="FiltersRow"],
[class*="searchRow"],
[class*="SearchRow"] {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: flex-end !important;
  gap: 12px !important;
  width: 100% !important;
  min-width: 0 !important;
}

/* Cada filtro ocupa espacio suficiente y no se corta */
.search-panel label,
.searchBox label,
.search-box label,
.hero-search label,
.home-search label,
.search-card label,
.filters-card label,
.filterBar label,
.filter-bar label,
.searchFilters label,
.search-filters label,
.quickSearch label,
.quick-search label,
[class*="filterField"],
[class*="FilterField"],
[class*="fieldGroup"],
[class*="FieldGroup"] {
  flex: 1 1 150px !important;
  min-width: 145px !important;
  max-width: 100% !important;
}

/* Inputs/selects completos, sin texto cortado raro */
.search-panel input,
.search-panel select,
.searchBox input,
.searchBox select,
.search-box input,
.search-box select,
.hero-search input,
.hero-search select,
.home-search input,
.home-search select,
.search-card input,
.search-card select,
.filters-card input,
.filters-card select,
.filterBar input,
.filterBar select,
.filter-bar input,
.filter-bar select,
.searchFilters input,
.searchFilters select,
.search-filters input,
.search-filters select,
.quickSearch input,
.quickSearch select,
.quick-search input,
.quick-search select {
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  white-space: normal !important;
  text-overflow: clip !important;
  overflow: visible !important;
}

/* Boton Buscar debajo y ancho completo cuando no entra */
.search-panel button[type="submit"],
.searchBox button[type="submit"],
.search-box button[type="submit"],
.hero-search button[type="submit"],
.home-search button[type="submit"],
.search-card button[type="submit"],
.filters-card button[type="submit"] {
  flex: 1 1 100% !important;
  width: 100% !important;
  min-height: 44px !important;
}

/* Mobile/tablet: dos columnas o una columna */
@media (max-width: 1100px) {
  .search-panel label,
  .searchBox label,
  .search-box label,
  .hero-search label,
  .home-search label,
  .search-card label,
  .filters-card label,
  [class*="filterField"],
  [class*="FilterField"] {
    flex-basis: calc(50% - 8px) !important;
    min-width: 0 !important;
  }
}

@media (max-width: 680px) {
  .search-panel label,
  .searchBox label,
  .search-box label,
  .hero-search label,
  .home-search label,
  .search-card label,
  .filters-card label,
  [class*="filterField"],
  [class*="FilterField"] {
    flex-basis: 100% !important;
  }
}

/* Evita que el header se coma el boton Publicar anuncio */
header, nav, .navbar, .topbar, .site-header, .global-header {
  max-width: 100%;
}
header nav, .navbar, .topbar, .site-header, .global-header {
  flex-wrap: wrap !important;
  gap: 8px !important;
}
`;

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="msvalidate.01" content="92E2D6B1365BE892A6A62706CAB4707E" />
          <style dangerouslySetInnerHTML={{ __html: casaCarResponsiveFix }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
