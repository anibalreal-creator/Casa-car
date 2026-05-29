import { DEFAULT_SITE, LANGUAGES, GLOBAL_COUNTRIES, GLOBAL_CURRENCIES } from "../../data/globalConfig";

export default function handler(_req, res) {
  return res.status(200).json({
    defaultSite: DEFAULT_SITE,
    languages: LANGUAGES,
    countries: GLOBAL_COUNTRIES,
    currencies: GLOBAL_CURRENCIES
  });
}
