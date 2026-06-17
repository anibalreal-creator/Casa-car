import { useLang } from "../context/LanguageContext";

export default function VehicleSpecsFields({ category, formData, setFormData }) {
  const { t } = useLang();
  const s = formData.specs_json || {};
  const subtype = String(formData.subtype || "");
  const setField = (key, value) => setFormData((prev) => ({ ...prev, specs_json: { ...(prev.specs_json || {}), [key]: value } }));
  const isGolfCategory = category === "Carros de golf / seguridad";
  const isAuto = category === "Auto" || category === "Camión" || category === "Moto" || isGolfCategory;
  const isNautica = category === "Náutica";
  const isGolfCart = isGolfCategory || (category === "Auto" && /golf|seguridad/i.test(subtype));
  if (!isAuto && !isNautica) return null;

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>{t("technical_sheet", "Ficha tecnica")}</h3>
      <div style={styles.grid}>
        <input style={styles.input} placeholder={t("brand_label", "Marca")} value={s.brand || ""} onChange={(e)=>setField("brand", e.target.value)} />
        <input style={styles.input} placeholder={t("model_label", "Modelo")} value={s.model || ""} onChange={(e)=>setField("model", e.target.value)} />
        <input style={styles.input} placeholder={t("year_label", "Ano")} value={s.year || ""} onChange={(e)=>setField("year", e.target.value)} />
      </div>
      {isAuto && !isGolfCart ? <div style={styles.grid}>
        <input style={styles.input} placeholder={t("vehicle_km", "Kilometros")} value={s.km || ""} onChange={(e)=>setField("km", e.target.value)} />
        <input style={styles.input} placeholder={t("filter_fuel", "Combustible")} value={s.fuel || ""} onChange={(e)=>setField("fuel", e.target.value)} />
        <input style={styles.input} placeholder={t("vehicle_transmission", "Transmision")} value={s.transmission || ""} onChange={(e)=>setField("transmission", e.target.value)} />
      </div> : null}
      {(category === "Auto" || category === "Camión") && !isGolfCart ? <div style={styles.grid}>
        <input style={styles.input} placeholder={t("vehicle_doors", "Puertas")} value={s.doors || ""} onChange={(e)=>setField("doors", e.target.value)} />
        <input style={styles.input} placeholder={t("filter_engine", "Motor")} value={s.engine || ""} onChange={(e)=>setField("engine", e.target.value)} />
        <input style={styles.input} placeholder={t("vehicle_color", "Color")} value={s.color || ""} onChange={(e)=>setField("color", e.target.value)} />
      </div> : null}
      {(category === "Auto" || category === "Camión" || category === "Moto") && !isGolfCart ? <div style={styles.grid}>
        <select style={styles.input} value={s.owner_condition || ""} onChange={(e)=>setField("owner_condition", e.target.value)}>
          <option value="">{t("vehicle_owner_origin", "Titularidad / origen")}</option>
          <option value="Primer dueño">{t("vehicle_first_owner", "Primer dueno")}</option>
          <option value="Segundo dueño">{t("vehicle_second_owner", "Segundo dueno")}</option>
          <option value="Concesionaria">{t("vehicle_dealer", "Concesionaria")}</option>
        </select>
        <select style={styles.input} value={s.plan_ahorro || ""} onChange={(e)=>setField("plan_ahorro", e.target.value)}>
          <option value="">{t("vehicle_savings_plan", "Plan de ahorro")}</option>
          <option value="No">{t("no", "No")}</option>
          <option value="Sí, adjudicado">{t("vehicle_awarded", "Si, adjudicado")}</option>
          <option value="Sí, en cuotas">{t("vehicle_installments", "Si, en cuotas")}</option>
          <option value="Consultar">{t("vehicle_ask", "Consultar")}</option>
        </select>
        <input style={styles.input} placeholder={t("vehicle_condition", "Estado general")} value={s.condition || ""} onChange={(e)=>setField("condition", e.target.value)} />
      </div> : null}
      {category === "Moto" ? <div style={styles.grid}>
        <input style={styles.input} placeholder={t("vehicle_cc", "Cilindrada")} value={s.cc || ""} onChange={(e)=>setField("cc", e.target.value)} />
        <input style={styles.input} placeholder={t("vehicle_motorcycle_type", "Tipo de moto")} value={s.type || ""} onChange={(e)=>setField("type", e.target.value)} />
        <input style={styles.input} placeholder={t("vehicle_color", "Color")} value={s.color || ""} onChange={(e)=>setField("color", e.target.value)} />
      </div> : null}
      {isGolfCart ? <div style={styles.grid}>
        <input style={styles.input} placeholder={t("golf_passengers", "Pasajeros / capacidad")} value={s.passengers || ""} onChange={(e)=>setField("passengers", e.target.value)} />
        <input style={styles.input} placeholder={t("golf_max_speed", "Velocidad max. km/h")} value={s.max_speed || ""} onChange={(e)=>setField("max_speed", e.target.value)} />
        <input style={styles.input} placeholder={t("golf_range", "Autonomia (km o hs)")} value={s.range || ""} onChange={(e)=>setField("range", e.target.value)} />
      </div> : null}
      {isNautica ? <div style={styles.grid}>
        <input style={styles.input} placeholder={t("nautical_length", "Eslora")} value={s.length || ""} onChange={(e)=>setField("length", e.target.value)} />
        <input style={styles.input} placeholder={t("nautical_beam", "Manga")} value={s.beam || ""} onChange={(e)=>setField("beam", e.target.value)} />
        <input style={styles.input} placeholder={t("nautical_cabins", "Cabinas")} value={s.cabins || ""} onChange={(e)=>setField("cabins", e.target.value)} />
        <input style={styles.input} placeholder={t("filter_engine", "Motor")} value={s.engine || ""} onChange={(e)=>setField("engine", e.target.value)} />
      </div> : null}
    </div>
  );
}

const styles = {
  wrap: { display: "grid", gap: 12, padding: 18, border: "1px solid #e5e7eb", borderRadius: 18, background: "#fff", minWidth: 0, maxWidth: "100%", overflow: "hidden" },
  title: { margin: 0, fontSize: 20, color: "#111827" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 12, minWidth: 0 },
  input: { width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box", padding: "13px 14px", border: "1px solid #d1d5db", borderRadius: 14, fontSize: 14, background: "#fff" },
};
