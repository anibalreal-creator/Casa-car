import { useLang } from '../../context/LanguageContext';

const SLOTS = [
  { id: "home_top", label: "Home superior", size: "1200x220", anchor: "/#home-top" },
  { id: "home_middle", label: "Home media", size: "1200x180", anchor: "/#home-middle" },
  { id: "search_sidebar", label: "Sidebar búsqueda", size: "320x420", anchor: "/buscar#search-sidebar" },
  { id: "listing_detail", label: "Ficha anuncio", size: "1200x220", anchor: "/listing/demo#listing-detail" },
  { id: "footer_global", label: "Pie global", size: "1200x140", anchor: "/#footer-global" },
];

export default function PublicidadSlots() {
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-bold">{t('ads_locations_title', 'Ubicaciones reales de slots')}</h1>
        <p className="mt-2 text-slate-600">
          {t('ads_locations_subtitle', 'Cada slot te lleva a una vista de ejemplo para entender dónde aparece el banner.')}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {SLOTS.map((slot) => (
            <a key={slot.id} href={slot.anchor} className="rounded-2xl border p-5 transition hover:border-indigo-400 hover:bg-indigo-50">
              <div className="text-xl font-bold">{slot.label}</div>
              <div className="mt-2 text-sm font-semibold text-indigo-700">{slot.size}</div>
              <div className="mt-3 text-sm text-slate-600">{t('view_location', 'Ver ubicación real')}</div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
