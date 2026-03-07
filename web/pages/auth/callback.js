import { supabase } from "../../lib/supabaseClient";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        await supabase.auth.exchangeCodeForSession(window.location.href);
        router.push("/dashboard");
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push("/login");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Procesando autenticación…</h2>
    </div>
  );
}
