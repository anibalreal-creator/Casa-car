import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function RequireAuth() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data?.session) {
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Verificando sesión…</h2>
    </div>
  );
}
