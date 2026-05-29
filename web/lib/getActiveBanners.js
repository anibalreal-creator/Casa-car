export function getActiveBanners(campaigns = [], slot = "") {
  const now = new Date();

  return (campaigns || [])
    .filter((item) => {
      if (!item) return false;
      if (slot && String(item.slot || "") !== String(slot)) return false;

      const status = String(item.status || "").toLowerCase();
      const activeFlag = item.active === true || status === "active" || status === "paid";

      if (!activeFlag) return false;
      if (item.starts_at && new Date(item.starts_at) > now) return false;
      if (item.ends_at && new Date(item.ends_at) <= now) return false;

      return true;
    })
    .sort((a, b) => {
      const priority = { premium: 3, destacado: 2, basico: 1 };
      return (priority[String(b?.plan || "").toLowerCase()] || 0) -
             (priority[String(a?.plan || "").toLowerCase()] || 0);
    });
}
