import { LANGUAGES } from '../data/globalConfig';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label style={compact ? styles.compactWrap : styles.wrap}>
      {!compact ? <span style={styles.label}>{t('language_label', 'Idioma')}</span> : null}
      <select value={language} onChange={(e) => setLanguage(e.target.value)} style={compact ? styles.compactSelect : styles.select}>
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  );
}

const baseSelect = { border:'1px solid #d1d5db', background:'#fff', borderRadius:12, padding:'10px 12px', fontWeight:700, color:'#111827' };
const styles = {
  wrap:{display:'flex', alignItems:'center', gap:8},
  compactWrap:{display:'flex', alignItems:'center'},
  label:{fontSize:13, color:'#6b7280', fontWeight:700},
  select:{...baseSelect},
  compactSelect:{...baseSelect, padding:'8px 10px', fontSize:13, borderRadius:10}
};
