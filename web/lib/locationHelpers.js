export function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const COUNTRY_ALIASES = {
  argentina: ["ar", "arg", "argentina"],
  brasil: ["br", "bra", "brazil", "brasil"],
  "estados unidos de america": ["us", "usa", "eeuu", "estados unidos", "united states", "united states of america"],
  uruguay: ["uy", "uru", "uruguay"],
  chile: ["cl", "chl", "chile"],
  paraguay: ["py", "pry", "paraguay"],
  bolivia: ["bo", "bol", "bolivia"],
  peru: ["pe", "per", "peru"],
  mexico: ["mx", "mex", "mexico"],
  espana: ["es", "esp", "spain", "espana"]
};

export function matchesCountry(countryValue = "", queryValue = "") {
  const country = normalizeText(countryValue);
  const query = normalizeText(queryValue);
  if (!query) return true;
  if (country.includes(query) || query.includes(country)) return true;

  for (const canonical of Object.keys(COUNTRY_ALIASES)) {
    const all = [canonical, ...COUNTRY_ALIASES[canonical]].map(normalizeText);
    if (all.includes(country) && all.some((alias) => alias === query || alias.includes(query) || query.includes(alias))) {
      return true;
    }
  }
  return false;
}

export function inferZoneFromAddressParts(address = {}) {
  return (
    address.suburb ||
    address.neighbourhood ||
    address.neighborhood ||
    address.city_district ||
    address.quarter ||
    address.borough ||
    address.township ||
    address.county ||
    ""
  );
}

export function inferCityFromAddressParts(address = {}) {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    ""
  );
}

export function uniqueSorted(values = []) {
  return [...new Set(
    values
      .filter(Boolean)
      .map((v) => String(v).trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));
}
