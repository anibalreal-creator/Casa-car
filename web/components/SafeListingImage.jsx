import { useEffect, useState } from "react";

const FALLBACK_IMAGE = "/placeholder-property.jpg";

function cssImageUrl(src) {
  return `url("${String(src || FALLBACK_IMAGE).replace(/"/g, '\\"')}")`;
}

export default function SafeListingImage({
  src,
  alt = "Anuncio",
  style = {},
  imageStyle = {},
  children = null,
}) {
  const [currentSrc, setCurrentSrc] = useState(src || FALLBACK_IMAGE);

  useEffect(() => {
    setCurrentSrc(src || FALLBACK_IMAGE);
  }, [src]);

  return (
    <div style={{ ...styles.frame, ...style }}>
      <div
        aria-hidden="true"
        style={{
          ...styles.blurBackground,
          backgroundImage: cssImageUrl(currentSrc),
        }}
      />
      <div aria-hidden="true" style={styles.softOverlay} />
      <img
        src={currentSrc}
        alt={alt}
        style={{ ...styles.image, ...imageStyle }}
        onError={() => setCurrentSrc(FALLBACK_IMAGE)}
      />
      {children}
    </div>
  );
}

const styles = {
  frame: {
    position: "relative",
    overflow: "hidden",
    background: "#e8eef7",
    isolation: "isolate",
  },
  blurBackground: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    filter: "blur(18px)",
    transform: "scale(1.16)",
    opacity: 0.46,
  },
  softOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    background:
      "linear-gradient(135deg, rgba(248,250,252,.88), rgba(226,232,240,.48))",
  },
  image: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center center",
    display: "block",
  },
};
