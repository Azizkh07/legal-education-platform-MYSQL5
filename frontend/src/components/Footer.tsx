import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Enhanced Brand Section */}
          <div className="lg:col-span-2 animate-slideInLeft">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 relative transform hover:scale-110 transition-all duration-500 hover:rotate-6">
                  <img 
                    src="/api/placeholder/80/80" 
                    alt="Clinique des Juristes"
                    className="w-full h-full object-contain filter drop-shadow-2xl"
                    style={{
                      content: `url("data:image/svg+xml;base64,${btoa(`
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <radialGradient id="footerBg" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                              <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:0.9" />
                            </radialGradient>
                          </defs>
                          <circle cx="100" cy="100" r="95" fill="url(#footerBg)" stroke="#3b82f6" stroke-width="3"/>
                          <path d="M60 140 Q40 120 40 100 Q40 80 60 60 Q80 40 100 40" 
                                fill="none" stroke="#1e293b" stroke-width="10" stroke-linecap="round"/>
                          <rect x="115" y="45" width="50" height="30" fill="#1e293b" rx="4"/>
                          <polygon points="110,75 170,75 140,90" fill="#1e293b"/>
                          <line x1="140" y1="90" x2="140" y2="120" stroke="#d97706" stroke-width="3"/>
                          <line x1="125" y1="100" x2="155" y2="100" stroke="#d97706" stroke-width="3"/>
                          <circle cx="120" cy="100" r="7" fill="none" stroke="#d97706" stroke-width="2"/>
                          <circle cx="160" cy="100" r="7" fill="none" stroke="#d97706" stroke-width="2"/>
                          <path d="M140 125 L140 165 Q140 175 130 175 Q120 175 120 165" 
                                fill="none" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
                          <text x="100" y="195" text-anchor="middle" font-family="serif" font-size="12" fill="#3b82f6" font-weight="bold" font-style="italic">
                            Clinique des Juristes
                          </text>
                        </svg>
                      `)}")`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl opacity-0 hover:opacity-100 transition-all duration-500 animate-pulse"></div>
                </div>
              </div>
              
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Clinique des Juristes
                </h3>
                <p className="text-blue-200 font-medium italic">
                  Excellence • Formation • Innovation
                </p>
              </div>
            </div>
            
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Votre partenaire de confiance pour une formation juridique d'excellence. 
              Nous combinons tradition et innovation pour offrir la meilleure expérience d'apprentissage 
              en droit et fiqh islamique.
            </p>
            
            {/* Enhanced Social Links */}
            <div className="flex space-x-4">
              {[
                { icon: '📘', name: 'Facebook', color: 'hover:text-blue-400' },
                { icon: '🐦', name: 'Twitter', color: 'hover:text-blue-300' },
                { icon: '💼', name: 'LinkedIn', color: 'hover:text-blue-500' },
                { icon: '📺', name: 'YouTube', color: 'hover:text-red-400' },
                { icon: '📷', name: 'Instagram', color: 'hover:text-pink-400' }
              ].map((social, index) => (
                <button
                  key={index}
                  className={`w-12 h-12 bg-white/10 rounded-full flex items-center justify-center ${social.color} transform hover:scale-110 transition-all duration-300 hover:bg-white/20 animate-pulse`}
                  style={{animationDelay: `${index * 0.1}s`}}
                  title={social.name}
                >
                  <span className="text-xl">{social.icon}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="animate-slideInRight" style={{animationDelay: '0.2s'}}>
            <h4 className="text-xl font-bold mb-6 text-blue-200">Navigation Rapide</h4>
            <ul className="space-y-3">
              {[
                { path: '/', label: 'Accueil', icon: '🏠' },
                { path: '/courses', label: 'Nos Cours', icon: '📚' },
                { path: '/blog', label: 'Blog Juridique', icon: '📰' },
                { path: '/about', label: 'À Propos', icon: 'ℹ️' },
                { path: '/contact', label: 'Contact', icon: '📞' }
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="flex items-center space-x-3 text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className="animate-slideInRight" style={{animationDelay: '0.4s'}}>
            <h4 className="text-xl font-bold mb-6 text-blue-200">Contactez-Nous</h4>
            <ul className="space-y-4">
              {[
                { icon: '📍', text: '123 Rue de la Justice, Paris, France' },
                { icon: '📞', text: '+33 1 23 45 67 89' },
                { icon: '📧', text: 'contact@cliniquejuristes.com' },
                { icon: '⏰', text: 'Lun-Ven: 9h-18h, Sam: 9h-12h' }
              ].map((contact, index) => (
                <li key={index} className="flex items-start space-x-3 text-gray-300">
                  <span className="text-lg mt-1 animate-pulse" style={{animationDelay: `${index * 0.2}s`}}>
                    {contact.icon}
                  </span>
                  <span className="leading-relaxed">{contact.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Enhanced Bottom Section */}
        <div className="mt-16 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 animate-slideInLeft">
              <div className="w-8 h-8">
                <img 
                  src="/api/placeholder/32/32" 
                  alt="CJ"
                  className="w-full h-full object-contain"
                  style={{
                    content: `url("data:image/svg+xml;base64,${btoa(`
                      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="25" r="24" fill="#3b82f6" stroke="#ffffff" stroke-width="1"/>
                        <text x="25" y="32" text-anchor="middle" font-family="serif" font-size="20" fill="white" font-weight="bold">CJ</text>
                      </svg>
                    `)}")`
                  }}
                />
              </div>
              <p className="text-gray-300">
                © {new Date().getFullYear()} Clinique des Juristes. Tous droits réservés.
              </p>
            </div>
            
            <div className="flex items-center space-x-6 animate-slideInRight">
              {[
                'Politique de Confidentialité',
                'Conditions d\'Utilisation',
                'Mentions Légales'
              ].map((link, index) => (
                <Link
                  key={index}
                  to={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm hover:underline"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;