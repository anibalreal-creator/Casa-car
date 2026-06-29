import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { supabaseBrowser } from '../lib/supabaseBrowser';

export default function FooterBlueBar() {
  const { t } = useLang();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabaseBrowser.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data?.user || null);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    window.location.href = '/';
  }

  return (
    <footer style={{ marginTop: 40, padding: '0 16px 32px', background: 'transparent' }}>
      <div style={styles.bar}>
        <div style={styles.brand}>
          <img src="/branding/casa-car-logo-main.jpg" alt="Casa-Car" style={styles.logo} />
          <div>
            <div style={styles.brandName}>Casa-Car</div>
            <div style={styles.brandTitle}>{t('footer_title', 'Propiedades, autos y mas')}</div>
            <div style={styles.brandText}>{t('footer_subtitle', 'Marketplace global de propiedades, vehiculos, turismo y espacios publicitarios.')}</div>
          </div>
        </div>

        <div style={styles.columns}>
          <div>
            <div style={styles.columnTitle}>{t('footer_sections', 'Secciones')}</div>
            <div style={styles.linkGrid}>
              <Link href="/buscar" style={linkStyle}>{t('footer_properties', 'Propiedades')}</Link>
              <Link href="/buscar?category=Autos" style={linkStyle}>{t('footer_cars', 'Autos')}</Link>
            </div>
          </div>
          <div>
            <div style={styles.columnTitle}>{t('footer_info', 'Informacion')}</div>
            <div style={styles.linkGrid}>
              <Link href="/publicar" style={linkStyle}>{t('footer_publish', 'Como publicar')}</Link>
              <Link href="/publicidad" style={linkStyle}>{t('footer_ads', 'Publicidad para empresas')}</Link>
              <Link href="/panel-empresas" style={linkStyle}>{t('footer_panel', 'Panel de empresas')}</Link>
              {user ? (
                <button type="button" onClick={signOut} style={buttonLinkStyle}>
                  {t('nav_logout', 'Cerrar sesion')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

const linkStyle = { color: '#fff', textDecoration: 'none', opacity: .96 };
const buttonLinkStyle = {
  color: '#fff',
  textDecoration: 'none',
  opacity: .96,
  border: 'none',
  background: 'transparent',
  padding: 0,
  textAlign: 'left',
  font: 'inherit',
  cursor: 'pointer',
};

const styles = {
  bar: {
    maxWidth: 1400,
    margin: '0 auto',
    background: 'linear-gradient(90deg,#1e1b4b 0%, #1d4ed8 70%, #2563eb 100%)',
    color: '#fff',
    padding: '26px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
    borderRadius: 24,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 },
  logo: { width: 110, height: 110, borderRadius: 22, objectFit: 'cover', background: '#fff', flexShrink: 0 },
  brandName: { fontSize: 30, fontWeight: 900, lineHeight: 1 },
  brandTitle: { fontSize: 21, fontWeight: 800, marginTop: 4 },
  brandText: { fontSize: 16, opacity: .96, marginTop: 8, maxWidth: 680, lineHeight: 1.35 },
  columns: { display: 'flex', gap: 48, flexWrap: 'wrap' },
  columnTitle: { fontSize: 20, fontWeight: 900, marginBottom: 8 },
  linkGrid: { display: 'grid', gap: 6, fontSize: 16 },
};
