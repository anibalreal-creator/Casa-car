export function formatPrice(moneda, precio) {
  const m = (moneda || "USD").toUpperCase();
  const n = Number(precio);

  if (!Number.isFinite(n)) return `${m} -`;

  // Formato simple (sin depender de locales raros)
  const formatted = n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
  return `${m} ${formatted}`;
}
