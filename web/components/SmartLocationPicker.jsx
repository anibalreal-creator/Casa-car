import { useEffect, useState } from "react";
import { inferZoneFromAddressParts, inferCityFromAddressParts } from "../lib/locationHelpers";
import { useLang } from "../context/LanguageContext";

export default function SmartLocationPicker({ setFormData }) {
  const { t, language } = useLang();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 4) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": language || "es"
          }
        });
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        setResults([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, language]);

  function pick(item) {
    const address = item.address || {};
    const zone = inferZoneFromAddressParts(address);
    const city = inferCityFromAddressParts(address);
    const state = address.state || address.region || "";
    const country = address.country || "";

    setFormData((prev) => ({
      ...prev,
      address: [address.road, address.house_number].filter(Boolean).join(" ").trim() || item.display_name || "",
      zone,
      city,
      state,
      country,
      lat: item.lat || "",
      lng: item.lon || ""
    }));

    setQuery(item.display_name || "");
    setResults([]);
  }

  return (
    <div style={styles.wrap}>
      <label style={styles.label}>{t("location_search_label", "Buscar ubicacion")}</label>
      <input
        style={styles.input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("location_search_placeholder", "Ej: Ocean Drive 10100, Miami")}
      />

      {results.length ? (
        <div style={styles.dropdown}>
          {results.map((item) => {
            const zone = inferZoneFromAddressParts(item.address || {});
            const city = inferCityFromAddressParts(item.address || {});
            return (
              <button key={item.place_id} type="button" style={styles.option} onClick={() => pick(item)}>
                <div style={styles.main}>{item.display_name}</div>
                <div style={styles.meta}>
                  {[zone, city, item.address?.state, item.address?.country].filter(Boolean).join(" · ")}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <div style={styles.help}>
        {t("location_search_help", "Al elegir una direccion, el sistema completa automaticamente zona, ciudad, provincia y pais.")}
      </div>
    </div>
  );
}

const styles = {
  wrap:{display:"grid",gap:8},
  label:{fontWeight:800,color:"#111827"},
  input:{padding:"14px 16px",border:"1px solid #d1d5db",borderRadius:12,fontSize:16,background:"#fff"},
  dropdown:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden"},
  option:{display:"block",width:"100%",textAlign:"left",padding:"12px 14px",border:"none",background:"#fff",cursor:"pointer",borderBottom:"1px solid #f3f4f6"},
  main:{fontWeight:700,color:"#111827"},
  meta:{fontSize:13,color:"#6b7280",marginTop:4},
  help:{fontSize:13,color:"#6b7280"}
};
