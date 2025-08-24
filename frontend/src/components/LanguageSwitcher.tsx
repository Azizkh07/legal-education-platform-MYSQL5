import React from 'react';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import '../styles/language-switcher.css';

const LANGS: { code: string; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const current = i18n.language || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'fr' : 'fr');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('i18nextLng', lng); } catch {}
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', lng === 'ar');
  };

  return (
    <div className="language-switcher" aria-label={t('language_switcher', 'Language')}>
      <select value={current} onChange={(e) => changeLanguage(e.target.value)} aria-label={t('language_switcher', 'Language')}>
        {LANGS.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;