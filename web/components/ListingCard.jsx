import React from "react";
import Link from "next/link";
import { useLang } from "../context/LanguageContext";
import { getAmenityLabels, getTourismSpecs, isTourismListing, tourismText } from "../lib/tourism";
import { getListingDetailHref } from "../lib/listingRoutes";
import { getCommercialStatus, isExampleListing } from "../lib/listingBadges";

function safeJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeArrayImageEntry(entry) {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  if (typeof entry === "object") {
    return (
      entry.url ||
      entry.src ||
      entry.path ||
      entry.secure_url ||
      entry.publicUrl ||
      ""
    );
  }
  return "";
}

function getImage(item) {
  if (!item) return "/placeholder-property.jpg";

  const direct = [
    item.image_url,
    item.imageUrl,
    item.image,
    item.cover_image,
    item.coverImage,
    item.cover,
    item.main_image,
    item.mainImage,
    item.thumbnail,
    item.thumbnail_url,
    item.photo_url,
    item.photo,
    item.banner,
    item.hero_image,
  ].find(Boolean);

  if (direct) return direct;

  const arrays = [
    safeJsonArray(item.images),
    safeJsonArray(item.photos),
    safeJsonArray(item.gallery),
    safeJsonArray(item.media),
    safeJsonArray(item.files),
  ];

  for (const arr of arrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      const first = normalizeArrayImageEntry(arr[0]);
      if (first) return first;
    }
  }

  return "/placeholder-property.jpg";
}

function formatPrice(value, currency, t) {
  if (value === null || value === undefined || value === "") return t("card_price_on_request", "Consultar");
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${currency || "USD"} ${num.toLocaleString("es-AR")}`;
}

export default function ListingCard(props) {
  const { t, language } = useLang();
  const item = props?.item || {};
  const isFavorite = Boolean(props?.isFavorite);
  const onToggleFavorite = props?.onToggleFavorite;

  const image = getImage(item);
  const title = item.title || item.name || item.titulo || t("card_no_title", "Publicación");
  const location =
    item.location ||
    item.city ||
    item.ciudad ||
    item.address ||
    item.direccion ||
    t("card_location_unknown", "Ubicación no informada");
  const price = formatPrice(item.price, item.currency, t);
  const id = item.id || item.listing_id || item.public_id || "";
  const detailHref = getListingDetailHref(id);
  const whatsapp = item.whatsapp || item.whatsapp_url || item.phone || "";
  const tourism = isTourismListing(item);
  const tourismSpecs = getTourismSpecs(item);
  const tourismAmenities = getAmenityLabels(item, language).slice(0, 3);
  const commercialStatus = getCommercialStatus(item);
  const exampleListing = isExampleListing(item);

  return (
    <div style={styles.card}>
      <div style={styles.imageContainer}>
        <img
          src={image}
          alt={title}
          style={styles.image}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder-property.jpg";
          }}
        />

        {typeof onToggleFavorite === "function" ? (
          <button
            type="button"
            aria-label={isFavorite ? t("favorite_title_remove", "Quitar de favoritos") : t("favorite_title_add", "Agregar a favoritos")}
            style={{
              ...styles.favoriteBtn,
              ...(isFavorite ? styles.favoriteBtnActive : {}),
            }}
            onClick={() => onToggleFavorite(item.id || item.listing_id || item.public_id)}
          >
            ❤
          </button>
        ) : null}
        {exampleListing ? <span style={styles.exampleBadge}>Ejemplo</span> : null}
        {commercialStatus ? (
          <>
            <span style={{ ...styles.statusRibbon, background: commercialStatus.color }}>{commercialStatus.label}</span>
            <span style={styles.statusWatermark}>{commercialStatus.label}</span>
          </>
        ) : null}
      </div>

      <div style={styles.content}>
        <div style={styles.price}>{price}</div>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.location}>{location}</p>
        {tourism ? (
          <div style={styles.tourismMeta}>
            <span style={styles.tourismChip}>{tourismSpecs.instant_book ? tourismText(language, 'instant_book') : tourismText(language, 'request_booking')}</span>
            {tourismSpecs.capacity ? <span style={styles.tourismChip}>{tourismSpecs.capacity} {tourismText(language, 'guests')}</span> : null}
            {tourismAmenities.map((label) => <span key={label} style={styles.tourismChip}>{label}</span>)}
          </div>
        ) : null}

        <div style={styles.actions}>
          {whatsapp ? (
            <a
              href={String(whatsapp).startsWith("http") ? whatsapp : `https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.whatsapp}
            >
              {t("card_whatsapp", "WhatsApp")}
            </a>
          ) : (
            <span style={styles.whatsappDisabled}>{t("card_whatsapp", "WhatsApp")}</span>
          )}

          <Link href={detailHref} style={styles.detail}>
            {t("card_detail", "Detalle")}
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 8px 22px rgba(15,23,42,.06)",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 10",
    background: "#f3f4f6",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  favoriteBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: "999px",
    border: "1px solid #fbcfe8",
    background: "#fff",
    color: "#e11d48",
    fontSize: 18,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,.12)",
  },
  favoriteBtnActive: {
    background: "#ffe4e6",
    borderColor: "#fb7185",
  },
  exampleBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 4,
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid rgba(146,64,14,.18)",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 900,
    boxShadow: "0 6px 16px rgba(0,0,0,.10)",
  },
  statusRibbon: {
    position: "absolute",
    top: 18,
    right: -42,
    zIndex: 5,
    width: 160,
    padding: "8px 0",
    color: "#fff",
    textAlign: "center",
    textTransform: "uppercase",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: ".08em",
    transform: "rotate(35deg)",
    boxShadow: "0 8px 18px rgba(15,23,42,.22)",
  },
  statusWatermark: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    display: "grid",
    placeItems: "center",
    color: "rgba(255,255,255,.42)",
    fontSize: 44,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: ".06em",
    transform: "rotate(-14deg)",
    textShadow: "0 3px 16px rgba(15,23,42,.32)",
    pointerEvents: "none",
  },
  content: {
    padding: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: 900,
    color: "#111827",
    marginBottom: 8,
  },
  title: {
    margin: "0 0 8px",
    fontSize: 18,
    lineHeight: 1.2,
    color: "#111827",
    fontWeight: 800,
  },
  location: {
    margin: "0 0 14px",
    color: "#4f46e5",
    fontWeight: 700,
  },
  tourismMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    margin: "0 0 14px",
  },
  tourismChip: {
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 999,
    padding: "5px 8px",
    fontWeight: 800,
    fontSize: 12,
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  whatsapp: {
    textDecoration: "none",
    background: "#4ade80",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 800,
  },
  whatsappDisabled: {
    background: "#d1d5db",
    color: "#374151",
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 800,
  },
  detail: {
    textDecoration: "none",
    background: "#1d4ed8",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 800,
  },
};
