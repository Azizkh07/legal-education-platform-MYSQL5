import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import "../styles/hf.css"

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`modern-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        {/* Logo */}
        <Link to="/" className="logo-container">
          <img
            src="/images/logoo.png"
            alt="Clinique Juriste Logo"
            className="logo-image"
          />
          <span className="logo-text">Clinique des Juristes</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-menu">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Accueil
          </Link>
          <Link 
            to="/courses" 
            className={`nav-link ${isActive('/courses') ? 'active' : ''}`}
          >
            Formations
          </Link>
          <Link 
            to="/blog" 
            className={`nav-link ${isActive('/blog') ? 'active' : ''}`}
          >
            Articles
          </Link>
          <Link 
            to="/contact" 
            className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
          >
            Contact
          </Link>

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div className="user-menu">
              <button className="user-button">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user.name}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="dropdown-menu">
               
                {user.is_admin && (
                  <Link to="/admin" className="dropdown-item">
                    Administration
                  </Link>
                )}
                <hr style={{ margin: '8px 0', border: '1px solid rgba(34, 197, 94, 0.1)' }} />
                <button onClick={handleLogout} className="dropdown-item">
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-button">
              Connexion
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={toggleMobileMenu}
          className="mobile-menu-button"
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

      {/* Mobile Navigation */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          Accueil
        </Link>
        <Link to="/courses" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          Formations
        </Link>
        <Link to="/blog" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          Articles
        </Link>
        <Link to="/contact" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
          Contact
        </Link>
        
        {isAuthenticated && user ? (
          <>
            <div style={{ margin: '20px 0', borderTop: '1px solid rgba(34, 197, 94, 0.1)' }}></div>
            <Link to="/dashboard" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
              Tableau de bord
            </Link>
            <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
              Mon profil
            </Link>
            {user.is_admin && (
              <Link to="/admin" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                Administration
              </Link>
            )}
            <button 
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="mobile-nav-link"
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <div style={{ margin: '20px 0', borderTop: '1px solid rgba(34, 197, 94, 0.1)' }}></div>
            <Link to="/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
              Connexion
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;