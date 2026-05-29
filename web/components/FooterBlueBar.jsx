import Link from 'next/link';
import { useLang } from '../context/LanguageContext';

export default function FooterBlueBar() {
  const { t } = useLang();
  return (
    <footer style={{ marginTop: 40, padding: '0 16px 32px', background: 'transparent' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', background: 'linear-gradient(90deg,#1e1b4b 0%, #1d4ed8 70%, #2563eb 100%)', color: '#fff', padding: '26px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap', borderRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src="/branding/casa-car-logo-main.jpg" alt="Casa-Car" style={{ width: 110, height: 110, borderRadius: 22, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>Casa-Car</div>
            <div style={{ fontSize: 21, fontWeight: 800, marginTop: 4 }}>{t('footer_title', 'Propiedades, autos y más')}</div>
            <div style={{ fontSize: 16, opacity: .96, marginTop: 8, maxWidth: 680 }}>{t('footer_subtitle', 'Marketplace global de propiedades, vehículos, turismo y espacios publicitarios.')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{t('footer_sections', 'Secciones')}</div>
            <div style={{ display: 'grid', gap: 6, fontSize: 16 }}>
              <Link href="/buscar" style={linkStyle}>{t('footer_properties', 'Propiedades')}</Link>
              <Link href="/buscar?category=Autos" style={linkStyle}>{t('footer_cars', 'Autos')}</Link>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{t('footer_info', 'Información')}</div>
            <div style={{ display: 'grid', gap: 6, fontSize: 16 }}>
              <Link href="/publicar" style={linkStyle}>{t('footer_publish', 'Cómo publicar')}</Link>
              <Link href="/publicidad" style={linkStyle}>{t('footer_ads', 'Publicidad para empresas')}</Link>
              <Link href="/panel-empresas" style={linkStyle}>{t('footer_panel', 'Panel de empresas')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

const linkStyle = { color: '#fff', textDecoration: 'none', opacity: .96 };
