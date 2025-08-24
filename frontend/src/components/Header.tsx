import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import "../styles/hf.css";

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/'); } catch (err) { console.error(err); }
  };

  const isActive = (path: string) => location.pathname === path;
  const toggleMobileMenu = () => setIsMenuOpen(p => !p);

  const isRtl = i18n.language && i18n.language.startsWith('ar');

  return (
    <header className={`modern-header ${isScrolled ? 'scrolled' : ''} ${isRtl ? 'rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="header-content">
        <Link to="/" className="logo-container">
          <img src="/images/logoo.png" alt={t('logo_alt', 'Clinique Juriste Logo')} className="logo-image" />
          <span className="logo-text">{t('site_title', 'Clinique des Juristes')}</span>
        </Link>

        <nav className="nav-menu" aria-label={t('nav.main', 'Main navigation')}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>{t('nav.home', 'Accueil')}</Link>
          <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'active' : ''}`}>{t('nav.courses', 'Formations')}</Link>
          <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`}>{t('nav.blog', 'Articles')}</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>{t('nav.contact', 'Contact')}</Link>

          <div style={{ marginLeft: isRtl ? 0 : 12, marginRight: isRtl ? 12 : 0 }}>
            <LanguageSwitcher />
          </div>

          {isAuthenticated && user ? (
            <div className="user-menu">
              <button className="user-button" aria-haspopup="true" aria-expanded="false">
                <span className="user-avatar">{user?.name ? String(user.name).charAt(0).toUpperCase() : 'U'}</span>
                <span className="user-name">{user?.name || t('user.default_name', 'User')}</span>
              </button>
              <div className="dropdown-menu" role="menu">
                {user?.is_admin && <Link to="/admin" className="dropdown-item">{t('header.admin', 'Administration')}</Link>}
                <hr style={{ margin: '8px 0', border: '1px solid rgba(34, 197, 94, 0.1)' }} />
                <button onClick={handleLogout} className="dropdown-item">{t('auth.logout', 'Déconnexion')}</button>
              </div>
            </div>
          ) : (
            // Use the nested key for the login button to avoid returning an object
            <Link to="/login" className="login-button">{t('auth.login.submit', 'Connexion')}</Link>
          )}
        </nav>

        <button onClick={toggleMobileMenu} className="mobile-menu-button" aria-label={t('menu.open', 'Toggle menu')}>
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`} role="menu">
        <Link to="/" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('nav.home', 'Accueil')}</Link>
        <Link to="/courses" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('nav.courses', 'Formations')}</Link>
        <Link to="/blog" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('nav.blog', 'Articles')}</Link>
        <Link to="/contact" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('nav.contact', 'Contact')}</Link>

        {isAuthenticated && user ? (
          <>
            <div style={{ margin: '20px 0', borderTop: '1px solid rgba(34, 197, 94, 0.1)' }} />
            <Link to="/dashboard" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('header.dashboard', 'Tableau de bord')}</Link>
            <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('header.profile', 'Mon profil')}</Link>
            {user?.is_admin && <Link to="/admin" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('header.admin', 'Administration')}</Link>}
            <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="mobile-nav-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>{t('auth.logout', 'Déconnexion')}</button>
          </>
        ) : (
          <Link to="/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>{t('auth.login.submit', 'Connexion')}</Link>
        )}
      </div>
    </header>
  );
};

export default Header;