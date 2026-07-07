import { useState } from "react";
import { getImagePresentation } from "../lib/imagePresentation";
import { getCommercialStatus } from "../lib/listingBadges";
import SafeListingImage from "./SafeListingImage";

export default function ImageGallery({ images = [], initialIndex = 0, item = null }) {
  const safe = Array.isArray(images) && images.length ? images : ["https://picsum.photos/seed/casacar/1200/800"];
  const [index, setIndex] = useState(initialIndex || 0);
  const current = safe[index] || safe[0];
  const imagePresentation = getImagePresentation(item || {});
  const commercialStatus = getCommercialStatus(item || {});

  function prev() { setIndex((i) => (i === 0 ? safe.length - 1 : i - 1)); }
  function next() { setIndex((i) => (i === safe.length - 1 ? 0 : i + 1)); }

  return (
    <div className="cc-gallery-root" style={styles.wrap}>
      <div className="cc-gallery-hero" style={styles.heroBox}>
        {safe.length > 1 ? <button type="button" onClick={prev} style={{ ...styles.nav, left: 10 }}>{"<"}</button> : null}
        <SafeListingImage
          src={current}
          alt="principal"
          style={styles.heroFrame}
          className="cc-gallery-frame"
          imageStyle={{ objectFit: imagePresentation?.fit || "contain", objectPosition: imagePresentation?.position || "center center" }}
        />
        {commercialStatus ? (
          <>
            <span style={{ ...styles.statusRibbon, background: commercialStatus.color }}>{commercialStatus.label}</span>
            <span style={styles.statusWatermark}>{commercialStatus.label}</span>
          </>
        ) : null}
        {safe.length > 1 ? <button type="button" onClick={next} style={{ ...styles.nav, right: 10 }}>{">"}</button> : null}
      </div>
      {safe.length > 1 ? (
        <div style={styles.thumbs}>
          {safe.map((img, idx) => (
            <button key={img + idx} type="button" onClick={() => setIndex(idx)} style={styles.thumbBtn(idx === index)}>
              <SafeListingImage
                src={img}
                alt={"thumb-" + idx}
                style={styles.thumbFrame}
                imageStyle={{ objectFit: imagePresentation?.fit || "contain", objectPosition: imagePresentation?.position || "center center" }}
              />
            </button>
          ))}
        </div>
      ) : null}
      <style jsx global>{`
        .cc-gallery-root,
        .cc-gallery-root * {
          box-sizing: border-box;
          min-width: 0;
        }

        .cc-gallery-frame {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          height: 100% !important;
        }

        @media (max-width: 720px) {
          .cc-gallery-hero {
            width: 100% !important;
            max-width: 100% !important;
            height: min(78vh, 430px) !important;
            min-height: 260px !important;
            border-radius: 14px !important;
            aspect-ratio: auto !important;
          }
          .cc-gallery-frame {
            height: 100% !important;
            min-height: 0 !important;
          }
          .cc-gallery-frame img {
            object-fit: contain !important;
            object-position: center center !important;
          }
        }

        @media (max-width: 420px) {
          .cc-gallery-hero {
            height: min(74vh, 390px) !important;
            min-height: 240px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrap: { display: "grid", gap: 10, width: "100%", maxWidth: "100%", minWidth: 0, overflow: "hidden" },
  heroBox: { position: "relative", overflow: "hidden", borderRadius: 18, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "100%", minWidth: 0, minHeight: 0, height: "clamp(280px, 52vw, 540px)", maxHeight: "min(72vh, 540px)", boxSizing: "border-box", isolation: "isolate" },
  heroFrame: { width: "100%", height: "100%", background: "#f8fafc" },
  nav: { position: "absolute", top: "50%", zIndex: 6, transform: "translateY(-50%)", width: 42, height: 42, borderRadius: "50%", border: "none", background: "#111827cc", color: "#fff", fontSize: 24, cursor: "pointer" },
  statusRibbon: { position: "absolute", top: 28, right: -58, zIndex: 5, width: 220, padding: "12px 0", color: "#fff", textAlign: "center", textTransform: "uppercase", fontWeight: 900, fontSize: 15, letterSpacing: ".1em", transform: "rotate(35deg)", boxShadow: "0 10px 24px rgba(15,23,42,.25)" },
  statusWatermark: { position: "absolute", inset: 0, zIndex: 2, display: "grid", placeItems: "center", color: "rgba(255,255,255,.36)", fontSize: 72, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", transform: "rotate(-14deg)", textShadow: "0 4px 20px rgba(15,23,42,.35)", pointerEvents: "none" },
  thumbs: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 10 },
  thumbBtn: (active) => ({ border: active ? "2px solid #2563eb" : "1px solid #d1d5db", padding: 0, borderRadius: 12, overflow: "hidden", background: "#fff", cursor: "pointer" }),
  thumbFrame: { width: "100%", height: 80, background: "#f8fafc" },
};
