import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { useLang } from "../context/LanguageContext";

export default function RouteGuard({ children, fallback = null }) {
  const router = useRouter();
  const { t } = useLang();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabaseBrowser.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const current = data?.user || null;
      setUser(current);
      setReady(true);
      if (!current) router.replace('/login');
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      const current = session?.user || null;
      setUser(current);
      setReady(true);
      if (!current) router.replace('/login');
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router]);

  if (!ready) return fallback || <div style={{padding:24,fontFamily:'Arial'}}>{t('auth_checking_session', 'Verificando sesion...')}</div>;
  if (!user) return fallback || <div style={{padding:24,fontFamily:'Arial'}}>{t('auth_redirecting', 'Redirigiendo...')}</div>;
  return children;
}
