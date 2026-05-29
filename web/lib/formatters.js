import { RATES, SYMBOLS } from "../data/options";

export function convertPrice(amount, from = "USD", to = "USD") {
  const base = Number(amount || 0) / (RATES[from] || 1);
  return base * (RATES[to] || 1);
}

export function formatPrice(amount, from = "USD", to = "USD") {
  const converted = convertPrice(amount, from, to);
  return `${SYMBOLS[to] || to} ${Math.round(converted).toLocaleString("es-AR")} ${to}`;
}

export function createSeoSlug(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
