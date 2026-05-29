import { supabaseBrowser } from "./supabaseBrowser";

const BASE_KEY = "casacar:favorites";
const USER_KEY = "casacar:favorite-user";
let remoteFavoritesPromise = null;

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function currentStorageKey() {
  if (typeof window === "undefined") return `${BASE_KEY}:guest`;
  const stored = normalizeEmail(window.localStorage.getItem(USER_KEY));
  return stored ? `${BASE_KEY}:${stored}` : `${BASE_KEY}:guest`;
}

function writeFavoriteIds(ids = []) {
  if (typeof window === "undefined") return [];
  const next = [...new Set(safeArray(ids).map(String))];
  window.localStorage.setItem(currentStorageKey(), JSON.stringify(next));
  return next;
}

function emitFavorites(ids = []) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("casacar:favorites-changed", { detail: safeArray(ids).map(String) }));
}

export function setFavoriteUser(email) {
  if (typeof window === "undefined") return;
  const normalized = normalizeEmail(email);
  if (normalized) window.localStorage.setItem(USER_KEY, normalized);
  else window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent("casacar:favorites-user-changed", { detail: normalized }));
}

export function getFavoriteIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(currentStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return [...new Set(safeArray(parsed).map(String))];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  return getFavoriteIds().includes(String(id));
}

async function getSession() {
  const { data } = await supabaseBrowser.auth.getSession();
  return data?.session || null;
}

async function fetchJson(path, options = {}) {
  const session = await getSession();
  const token = session?.access_token || "";
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || "No se pudo sincronizar favoritos");
  return payload;
}

export async function refreshFavoriteIdsRemote(force = false) {
  if (typeof window === "undefined") return [];
  if (!force && remoteFavoritesPromise) return remoteFavoritesPromise;

  remoteFavoritesPromise = (async () => {
    const session = await getSession();
    const user = session?.user || null;
    if (!user) {
      setFavoriteUser("");
      emitFavorites([]);
      return [];
    }

    setFavoriteUser(user.email || "");
    const payload = await fetchJson("/api/secure/favorites?mode=ids", { method: "GET" });
    const ids = writeFavoriteIds(payload?.ids || []);
    emitFavorites(ids);
    return ids;
  })();

  try {
    return await remoteFavoritesPromise;
  } finally {
    remoteFavoritesPromise = null;
  }
}

export async function syncFavoriteUserFromSession() {
  if (typeof window === "undefined") return;
  const session = await getSession();
  const user = session?.user || null;
  setFavoriteUser(user?.email || "");
  if (user) await refreshFavoriteIdsRemote(true);
  else emitFavorites([]);
}

export async function toggleFavorite(id) {
  if (typeof window === "undefined") return [];
  const key = String(id || "").trim();
  if (!key) return getFavoriteIds();

  const session = await getSession();
  const user = session?.user || null;
  if (!user) {
    emitFavorites([]);
    return [];
  }

  setFavoriteUser(user.email || "");
  const payload = await fetchJson("/api/secure/favorites", {
    method: "POST",
    body: JSON.stringify({ listing_id: key }),
  });
  const next = writeFavoriteIds(payload?.ids || []);
  emitFavorites(next);
  return next;
}

export function clearFavoriteState() {
  if (typeof window === "undefined") return;
  setFavoriteUser("");
  emitFavorites([]);
}

export function subscribeFavorites(callback) {
  if (typeof window === "undefined") return () => {};
  const emit = (ids) => callback(Array.isArray(ids) ? ids.map(String) : getFavoriteIds());
  const onStorage = () => emit();
  const onCustom = (event) => emit(event?.detail);
  const onUser = () => emit();
  window.addEventListener("storage", onStorage);
  window.addEventListener("casacar:favorites-changed", onCustom);
  window.addEventListener("casacar:favorites-user-changed", onUser);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("casacar:favorites-changed", onCustom);
    window.removeEventListener("casacar:favorites-user-changed", onUser);
  };
}
