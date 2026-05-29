export default function BrandLogo({ size = 56, compact = false }) {
  return (
    <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
      <img src="/branding/casa-car-logo.png" alt="Casa-Car" style={{ width: size, height: size, objectFit: "contain", borderRadius: 12 }} />
      {!compact ? (
        <span style={{ display: "grid", lineHeight: 1 }}>
          <span style={{ fontSize: 30, fontWeight: 900, color: "#111827", letterSpacing: "-0.04em" }}>Casa-Car</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", letterSpacing: ".10em" }}>PROPIEDADES, AUTOS Y MÁS</span>
        </span>
      ) : null}
    </a>
  );
}
