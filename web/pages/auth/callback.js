import { supabase } from "../../lib/supabaseClient";
import { useEffect } from "react";
import { useRouter } from "next/router";

function safeNextPath(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const path = String(raw || "/dashboard").trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/login")) return "/dashboard";
  return path;
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const handleAuth = async () => {
      try {
        await supabase.auth.exchangeCodeForSession(window.location.href);
        router.push(safeNextPath(router.query.next));
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push("/login");
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
