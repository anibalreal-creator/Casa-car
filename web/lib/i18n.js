
export const translations = {
  es: {
    search: "Buscar",
    home: "Inicio",
    myListings: "Mis anuncios",
    favorites: "Favoritos",
    ads: "Publicidad",
    companies: "Empresas",
    plans: "Planes",
    post: "Publicar",
  },
  en: {
    search: "Search",
    home: "Home",
    myListings: "My listings",
    favorites: "Favorites",
    ads: "Ads",
    companies: "Companies",
    plans: "Plans",
    post: "Post listing",
  }
};

export const getLang = () => {
  if (typeof window === "undefined") return "es";
  return localStorage.getItem("lang") || "es";
};
