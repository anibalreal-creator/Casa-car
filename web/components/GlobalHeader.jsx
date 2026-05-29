import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import { useLang } from '../context/LanguageContext';
import { clearFavoriteState, setFavoriteUser } from '../lib/favorites';

function buildNav(t) {
  return [
    { href: '/', label: t('nav_home', 'Inicio') },
    { href: '/buscar', label: t('nav_search', 'Buscar') },
    { href: '/mis-anuncios', label: t('nav_my_ads', 'Mis anuncios') },
    { href: '/favoritos', label: t('nav_favorites', 'Favoritos') },
    { href: '/publicidad', label: t('nav_ads', 'Publicidad') },
    { href: '/empresa', label: t('nav_companies', 'Empresas') },
    { href: '/planes', label: t('nav_plans', 'Planes') },
    { href: '/panel-empresas', label: t('nav_company_panel', 'Panel empresas') },
    { href: '/dashboard/company', label: t('nav_company_dashboard', 'Dashboard empresa') },
  ];
}

export default function GlobalHeader() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t, languages } = useLang();
  const navItems = useMemo(() => buildNav(t), [t]);
  const mobileBottomItems = useMemo(() => [
    { href: '/', label: t('nav_home', 'Inicio'), mark: 'I' },
    { href: '/buscar', label: t('nav_search', 'Buscar'), mark: 'B' },
    { href: '/publicar', label: t('footer_publish', 'Publicar'), mark: '+' },
    { href: '/favoritos', label: t('nav_favorites', 'Favoritos'), mark: 'F' },
    { href: user ? '/mis-anuncios' : '/login', label: user ? t('nav_my_ads', 'Mis anuncios') : t('nav_login', 'Ingresar'), mark: user ? 'M' : 'E' },
  ], [t, user]);

  useEffect(() => {
    let mounted = true;

    supabaseBrowser.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const nextUser = data?.user || null;
      setUser(nextUser);
      setFavoriteUser(nextUser?.email || '');
      if (!nextUser) clearFavoriteState();
    });

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const nextUser = session?.user || null;
      setUser(nextUser);
      setFavoriteUser(nextUser?.email || '');
      if (!nextUser) clearFavoriteState();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const userLabel = useMemo(() => {
    if (!user?.email) return null;
    return user.email.length > 26 ? `${user.email.slice(0, 26)}…` : user.email;
  }, [user]);

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    setFavoriteUser('');
    clearFavoriteState();
    window.location.href = '/';
  }

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div className="desktopHeader" style={styles.desktopHeader}>
          <div style={styles.desktopTopRow}>
            <Link href="/" style={styles.brand}>
              <img src="/branding/casa-car-logo.png" alt="Casa-Car" style={styles.logo} />
              <div style={styles.brandCopy}>
                <div style={styles.brandTitle}>Casa-Car</div>
                <div style={styles.brandSub}>{t('brand_subtitle', 'Marketplace global de propiedades, autos y más')}</div>
              </div>
            </Link>

            <div style={styles.desktopActions}>
              <div style={styles.langWrap}>
                <span style={styles.langLabel}>{t('lang_label', 'Idioma')}</span>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={styles.select}>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>

              {user ? (
                <span title={user.email} style={styles.user}>{userLabel}</span>
              ) : (
                <Link href="/dashboard" style={styles.linkMuted}>{t('nav_login', 'Ingresar')}</Link>
              )}

              {user ? (
                <button type="button" onClick={signOut} style={styles.buttonAlt}>{t('nav_logout', 'Cerrar sesión')}</button>
              ) : null}

              <Link href="/publicar" style={styles.buttonPrimary}>{t('nav_publish', '+ Publicar anuncio')}</Link>
            </div>
          </div>

          <div style={styles.desktopBottomRow}>
            <nav style={styles.desktopNav}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} style={styles.link}>{item.label}</Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mobileHeader" style={styles.mobileHeader}>
          <div style={styles.mobileTopRow}>
            <Link href="/" style={styles.brand}>
              <img src="/branding/casa-car-logo.png" alt="Casa-Car" style={styles.mobileLogo} />
              <div style={styles.brandCopy}>
                <div style={styles.mobileBrandTitle}>Casa-Car</div>
                <div style={styles.mobileBrandSub}>{t('brand_subtitle', 'Marketplace global de propiedades, autos y más')}</div>
              </div>
            </Link>

            <button
              type="button"
              aria-label={menuOpen ? t('menu_close', 'Cerrar menú') : t('menu_open', 'Abrir menú')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
              className="mobileToggle"
              style={styles.mobileToggle}
            >
              <span style={styles.burgerLine} />
              <span style={styles.burgerLine} />
              <span style={styles.burgerLine} />
            </button>
          </div>

          <div className={`mobilePanel ${menuOpen ? 'open' : ''}`} style={{ ...styles.mobilePanel, ...(menuOpen ? styles.mobilePanelOpen : null) }}>
            <nav style={styles.mobileNav}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div style={styles.mobileControls}>
              <div style={styles.mobileField}>
                <span style={styles.langLabel}>{t('lang_label', 'Idioma')}</span>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={styles.mobileSelect}>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>

              {user ? <span style={styles.mobileUser}>{user.email}</span> : <Link href="/dashboard" style={styles.mobileLinkBox}>{t('nav_login', 'Ingresar')}</Link>}
              {user ? <button type="button" onClick={signOut} style={styles.mobileSecondary}>{t('nav_logout', 'Cerrar sesión')}</button> : null}
              <Link href="/publicar" style={styles.mobilePrimary}>{t('nav_publish', '+ Publicar anuncio')}</Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mobileHeader {
          display: none;
        }

        @media (max-width: 860px) {
          .desktopHeader {
            display: none !important;
          }

          .mobileHeader {
            display: block !important;
          }

          .mobileToggle {
            display: inline-flex !important;
          }

          .mobilePanel {
            display: block;
          }

          .mobileBottomNav {
            display: grid !important;
          }
        }
      `}</style>

      <nav className="mobileBottomNav" style={styles.mobileBottomNav} aria-label={t('mobile_bottom_nav', 'Navegacion mobile')}>
        {mobileBottomItems.map((item) => (
          <Link key={item.href} href={item.href} style={styles.mobileBottomLink}>
            <span style={styles.mobileBottomMark}>{item.mark}</span>
            <span style={styles.mobileBottomText}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    background: 'rgba(255,255,255,.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 10px 24px rgba(15,23,42,.05)',
  },
  container: {
    maxWidth: 1480,
    margin: '0 auto',
    padding: '10px 16px 9px',
  },
  desktopHeader: { display: 'block' },
  desktopTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  desktopBottomRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid #eef2f7',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textDecoration: 'none',
    color: '#111827',
    minWidth: 0,
    flexShrink: 0,
  },
  brandCopy: { minWidth: 0 },
  logo: {
    width: 52, height: 52, maxWidth: 52, maxHeight: 52, objectFit: 'contain', borderRadius: 16,
    boxShadow: '0 10px 24px rgba(15,23,42,.14)',
    border: 'none', background: 'transparent',
  },
  mobileLogo: { width: 48, height: 48, objectFit: 'contain', borderRadius: 14, boxShadow: '0 8px 18px rgba(15,23,42,.14)' },
  brandTitle: { fontWeight: 900, fontSize: 22, lineHeight: 1 },
  brandSub: { marginTop: 5, color: '#6b7280', fontSize: 12, maxWidth: 300 },
  mobileBrandTitle: { fontWeight: 900, fontSize: 20, lineHeight: 1 },
  mobileBrandSub: { marginTop: 4, color: '#6b7280', fontSize: 12, maxWidth: 180 },
  desktopActions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', justifyContent: 'flex-end', minWidth: 0 },
  langWrap: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 9px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 },
  langLabel: { fontSize: 12, fontWeight: 800, color: '#6b7280' },
  select: { border: 'none', background: 'transparent', fontWeight: 800, color: '#111827', outline: 'none', maxWidth: 118 },
  user: { padding: '9px 10px', borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb', fontWeight: 800, color: '#374151', whiteSpace: 'nowrap', maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis' },
  linkMuted: { textDecoration: 'none', color: '#374151', fontWeight: 800, whiteSpace: 'nowrap' },
  buttonAlt: { border: '1px solid #e5e7eb', background: '#fff', color: '#111827', borderRadius: 12, padding: '10px 12px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' },
  buttonPrimary: { textDecoration: 'none', background: 'linear-gradient(90deg,#111827,#4338ca)', color: '#fff', borderRadius: 12, padding: '11px 13px', fontWeight: 900, boxShadow: '0 10px 22px rgba(67,56,202,.22)', whiteSpace: 'nowrap', flexShrink: 0 },
  desktopNav: { display: 'flex', gap: 7, flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', scrollbarWidth: 'none' },
  link: { textDecoration: 'none', color: '#111827', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', padding: '8px 9px', borderRadius: 10 },
  mobileHeader: { display: 'none' },
  mobileTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  mobileToggle: { display: 'none', border: '1px solid #e5e7eb', background: '#fff', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, cursor: 'pointer' },
  burgerLine: { width: 18, height: 2, background: '#111827', borderRadius: 999 },
  mobilePanel: { maxHeight: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none', transition: 'all .25s ease', paddingTop: 0 },
  mobilePanelOpen: { maxHeight: 720, opacity: 1, pointerEvents: 'auto', paddingTop: 14 },
  mobileNav: { display: 'grid', gap: 8 },
  mobileLink: { textDecoration: 'none', color: '#111827', fontWeight: 800, padding: '12px 14px', borderRadius: 14, border: '1px solid #eef2f7', background: '#fff' },
  mobileControls: { display: 'grid', gap: 10, marginTop: 12 },
  mobileField: { display: 'grid', gap: 6, padding: '12px 14px', borderRadius: 14, border: '1px solid #eef2f7', background: '#fff' },
  mobileSelect: { border: 'none', background: 'transparent', outline: 'none', fontWeight: 800, color: '#111827', padding: 0 },
  mobileUser: { padding: '12px 14px', borderRadius: 14, border: '1px solid #eef2f7', background: '#fff', color: '#374151', fontWeight: 800, wordBreak: 'break-all' },
  mobileLinkBox: { textDecoration: 'none', color: '#111827', fontWeight: 800, padding: '12px 14px', borderRadius: 14, border: '1px solid #eef2f7', background: '#fff' },
  mobileSecondary: { border: '1px solid #e5e7eb', background: '#fff', color: '#111827', borderRadius: 14, padding: '12px 14px', fontWeight: 900, cursor: 'pointer' },
  mobilePrimary: { textDecoration: 'none', background: 'linear-gradient(90deg,#111827,#4338ca)', color: '#fff', borderRadius: 14, padding: '13px 16px', fontWeight: 900, textAlign: 'center' },
  mobileBottomNav: {
    display: 'none',
    position: 'fixed',
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 60,
    gridTemplateColumns: 'repeat(5,1fr)',
    gap: 6,
    padding: 8,
    borderRadius: 20,
    border: '1px solid rgba(226,232,240,.95)',
    background: 'rgba(255,255,255,.96)',
    boxShadow: '0 18px 45px rgba(15,23,42,.18)',
    backdropFilter: 'blur(14px)',
  },
  mobileBottomLink: {
    minWidth: 0,
    textDecoration: 'none',
    color: '#111827',
    display: 'grid',
    justifyItems: 'center',
    gap: 3,
    padding: '7px 3px',
    borderRadius: 14,
    fontWeight: 900,
  },
  mobileBottomMark: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: 'grid',
    placeItems: 'center',
    background: '#eef2ff',
    color: '#1d4ed8',
    fontSize: 12,
    lineHeight: 1,
  },
  mobileBottomText: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 10,
  },
};
