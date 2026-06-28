import { supabase } from "../../lib/supabaseClient";
import { useEffect } from "react";
import { useRouter } from "next/router";

function safeNextPath(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const path = String(raw || "/dashboard").trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/login")) return "/dashboard";
  return path;
}

function readOAuthError() {
  if (typeof window === "undefined") return "";
  const search = new URLSearchParams(window.location.search || "");
  const hash = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
  return (
    search.get("error_description") ||
    search.get("error") ||
    hash.get("error_description") ||
    hash.get("error") ||
    ""
  );
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const handleAuth = async () => {
      try {
        const oauthError = readOAuthError();
        if (oauthError) {
          router.push(`/login?auth_error=${encodeURIComponent(oauthError)}`);
          return;
        }

        await supabase.auth.exchangeCodeForSession(window.location.href);
        router.push(safeNextPath(router.query.next));
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push(`/login?auth_error=${encodeURIComponent(error?.message || "auth_error")}`);
      }
    };

    handleAuth();
  }, [router, router.isReady]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Procesando autenticación…</h2>
    </div>
  );
}
