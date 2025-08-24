import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import "../styles/hf.css";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Translation hook - now that we know i18n works
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try { 
      await logout(); 
      navigate('/'); 
    } catch (err) { 
      console.error(err); 
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const toggleMobileMenu = () => setIsMenuOpen(p => !p);

  return (
    <header className={`modern-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <Link to="/" className="logo-container">
          <img src="/images/logoo.png" alt={t('logo_alt', 'Clinique Juriste Logo')} className="logo-image" />
          <span className="logo-text">{t('site_title', 'Clinique des Juristes')}</span>
        </Link>

        <nav className="nav-menu">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            {t('nav.home', 'Accueil')}
          </Link>
          <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'active' : ''}`}>
            {t('nav.courses', 'Formations')}
          </Link>
          <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`}>
            {t('nav.articles', 'Articles')}
          </Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>
            {t('nav.contact', 'Contact')}
          </Link>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {isAuthenticated && user ? (
            <div className="user-menu">
              <button className="user-button">
                <span className="user-avatar">
                  {user?.name ? String(user.name).charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="user-name">{user?.name || t('user.default_name', 'User')}</span>
              </button>
              <div className="dropdown-menu">
                {user?.is_admin && (
                  <Link to="/admin" className="dropdown-item">
                    {t('user.administration', 'Administration')}
                  </Link>
                )}
                <hr style={{ margin: '8px 0', border: '1px solid rgba(34, 197, 94, 0.1)' }} />
                <button onClick={handleLogout} className="dropdown-item">
                  {t('user.logout', 'Déconnexion')}
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-button">
              {t('auth.login', 'Connexion')}
            </Link>
          )}
        </nav>

        <button 
          onClick={toggleMobileMenu} 
          className="mobile-menu-button" 
          aria-label={t('nav.toggle_menu', 'Toggle menu')}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          {t('nav.home', 'Accueil')}
        </Link>
        <Link to="/courses" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          {t('nav.courses', 'Formations')}
        </Link>
        <Link to="/blog" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          {t('nav.articles', 'Articles')}
        </Link>
        <Link to="/contact" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          {t('nav.contact', 'Contact')}
        </Link>

        {/* Language Switcher in mobile menu */}
        <div style={{ padding: '10px 0' }}>
          <LanguageSwitcher />
        </div>

        {isAuthenticated && user ? (
          <>
            <div style={{ margin: '20px 0', borderTop: '1px solid rgba(34, 197, 94, 0.1)' }} />
            <Link to="/dashboard" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
              {t('nav.dashboard', 'Tableau de bord')}
            </Link>
            <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
              {t('nav.profile', 'Mon profil')}
            </Link>
            {user?.is_admin && (
              <Link to="/admin" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('user.administration', 'Administration')}
              </Link>
            )}
            <button 
              onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
              className="mobile-nav-link" 
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              {t('user.logout', 'Déconnexion')}
            </button>
          </>
        ) : (
          <Link to="/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            {t('auth.login', 'Connexion')}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;