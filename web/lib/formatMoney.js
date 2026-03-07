export function formatMoney(moneda, precio) {
  const cur = (moneda || "USD").toUpperCase();
  const n = Number(precio || 0);

  // Formato simple: USD 30.000
  const num = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );
  return `${cur} ${num}`;
}
