import React from 'react';
import { Link } from 'react-router-dom';
import "../styles/hf.css"
const Footer: React.FC = () => {
  return (
    <footer className="modern-footer">
      {/* Background Pattern */}
      <div className="footer-bg-pattern"></div>
      
      {/* Floating Shapes */}
      <div className="footer-floating-shapes">
        <div className="footer-shape"></div>
        <div className="footer-shape"></div>
        <div className="footer-shape"></div>
      </div>
      
      <div className="container footer-content">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="brand-header">
              <div className="brand-logo">
                <div className="logo-glow"></div>
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <radialGradient id="footerBg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.9" />
                    </radialGradient>
                  </defs>
                  <circle cx="100" cy="100" r="95" fill="url(#footerBg)" stroke="#3b82f6" strokeWidth="3"/>
                  <path d="M60 140 Q40 120 40 100 Q40 80 60 60 Q80 40 100 40" 
                        fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round"/>
                  <rect x="115" y="45" width="50" height="30" fill="#1e293b" rx="4"/>
                  <polygon points="110,75 170,75 140,90" fill="#1e293b"/>
                  <line x1="140" y1="90" x2="140" y2="120" stroke="#d97706" strokeWidth="3"/>
                  <line x1="125" y1="100" x2="155" y2="100" stroke="#d97706" strokeWidth="3"/>
                  <circle cx="120" cy="100" r="7" fill="none" stroke="#d97706" strokeWidth="2"/>
                  <circle cx="160" cy="100" r="7" fill="none" stroke="#d97706" strokeWidth="2"/>
                  <path d="M140 125 L140 165 Q140 175 130 175 Q120 175 120 165" 
                        fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round"/>
                  <text x="100" y="195" textAnchor="middle" fontFamily="serif" fontSize="12" fill="#3b82f6" fontWeight="bold" fontStyle="italic">
                    Clinique des Juristes
                  </text>
                </svg>
              </div>
              
              <div>
                <h3 className="brand-title">
                  Clinique des Juristes
                </h3>
                <p className="brand-tagline">
                  Excellence • Formation • Innovation
                </p>
              </div>
            </div>
            
            <p className="brand-description">
              Votre partenaire de confiance pour une formation juridique d'excellence. 
              Nous combinons tradition et innovation pour offrir la meilleure expérience d'apprentissage 
              en droit et fiqh islamique.
            </p>
            
            {/* Social Links */}
            <div className="social-links">
              {[
                { icon: '📘', name: 'Facebook', url: '#' },
                { icon: '🐦', name: 'Twitter', url: '#' },
                { icon: '💼', name: 'LinkedIn', url: '#' },
                { icon: '📺', name: 'YouTube', url: '#' },
                { icon: '📷', name: 'Instagram', url: '#' }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className="social-link"
                  title={social.name}
                  aria-label={social.name}
                >
                  <span>{social.icon}</span>
                </a>
              ))}
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-title">Navigation Rapide</h4>
            <ul className="footer-links">
              {[
                { path: '/', label: 'Accueil', icon: '🏠' },
                { path: '/courses', label: 'Nos Cours', icon: '📚' },
                { path: '/blog', label: 'Blog Juridique', icon: '📰' },
                { path: '/about', label: 'À Propos', icon: 'ℹ️' },
                { path: '/contact', label: 'Contact', icon: '📞' }
              ].map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="footer-link">
                    <span className="link-icon">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className="footer-section">
            <h4 className="footer-title">Contactez-Nous</h4>
            <div className="footer-links">
              {[
                { icon: '📍', text: '123 Rue de la Justice, Paris, France' },
                { icon: '📞', text: '+33 1 23 45 67 89' },
                { icon: '📧', text: 'contact@cliniquejuristes.com' },
                { icon: '⏰', text: 'Lun-Ven: 9h-18h, Sam: 9h-12h' }
              ].map((contact, index) => (
                <div key={index} className="contact-item">
                  <span className="contact-icon">{contact.icon}</span>
                  <span>{contact.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="copyright">
            <div className="copyright-logo">
              <svg viewBox="0 0 50 50" className="w-full h-full">
                <circle cx="25" cy="25" r="24" fill="#3b82f6" stroke="#ffffff" strokeWidth="1"/>
                <text x="25" y="32" textAnchor="middle" fontFamily="serif" fontSize="20" fill="white" fontWeight="bold">CJ</text>
              </svg>
            </div>
            <p>
              © {new Date().getFullYear()} Clinique des Juristes. Tous droits réservés.
            </p>
          </div>
          
          <div className="legal-links">
            {[
              'Politique de Confidentialité',
              'Conditions d\'Utilisation',
              'Mentions Légales'
            ].map((link, index) => (
              <Link
                key={index}
                to={`/${link.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`}
                className="legal-link"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;