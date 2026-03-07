export function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined) return "";

  const number = Number(value);

  if (isNaN(number)) return "";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
}
