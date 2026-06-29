const COMMERCIAL_STATUS = {
  vendido: { key: "vendido", label: "Vendido", color: "#dc2626" },
  sold: { key: "vendido", label: "Vendido", color: "#dc2626" },
  alquilado: { key: "alquilado", label: "Alquilado", color: "#7c3aed" },
  rented: { key: "alquilado", label: "Alquilado", color: "#7c3aed" },
  reservado: { key: "reservado", label: "Reservado", color: "#f59e0b" },
  reserved: { key: "reservado", label: "Reservado", color: "#f59e0b" },
};

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getCommercialStatus(item = {}) {
  const specs = item?.specs_json && typeof item.specs_json === "object" ? item.specs_json : {};
  const raw =
    item.commercial_status ||
    item.availability_status ||
    item.deal_status ||
    item.status_badge ||
    specs.commercial_status ||
    specs.availability_status ||
    specs.deal_status ||
    specs.status_badge ||
    "";

  return COMMERCIAL_STATUS[normalize(raw)] || null;
}

export function isExampleListing(item = {}) {
  const specs = item?.specs_json && typeof item.specs_json === "object" ? item.specs_json : {};
  const id = String(item?.id || "");
  return Boolean(
    item.is_example ||
    item.is_demo ||
    item.demo ||
    specs.is_example ||
    specs.is_demo ||
    id.startsWith("demo-") ||
    id.startsWith("sample-") ||
    id.startsWith("fallback-")
  );
}

export function normalizeCommercialStatus(value) {
  const status = COMMERCIAL_STATUS[normalize(value)];
  return status ? status.key : "";
}
