import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CJ</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Clinique Juriste</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive('/') ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Accueil
            </Link>
            <Link 
              to="/courses" 
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive('/courses') ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Formations
            </Link>
            <Link 
              to="/blog" 
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive('/blog') ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Articles
            </Link>
            <Link 
              to="/contact" 
              className={`text-gray-700 hover:text-blue-600 transition-colors ${
                isActive('/contact') ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{user.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link 
                    to="/dashboard" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Tableau de bord
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mon profil
                  </Link>
                  {/* FIXED: Use is_admin instead of isAdmin */}
                  {user.is_admin && (
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Administration
                    </Link>
                  )}
                  <hr className="my-1" />
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Connexion
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
              <Link to="/" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Accueil
              </Link>
              <Link to="/cours" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Formations
              </Link>
              <Link to="/blog" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Articles
              </Link>
              <Link to="/contact" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Contact
              </Link>
              
              {isAuthenticated && user ? (
                <>
                  <hr className="my-2" />
                  <Link to="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                    Tableau de bord
                  </Link>
                  <Link to="/profile" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                    Mon profil
                  </Link>
                  {/* FIXED: Use is_admin instead of isAdmin */}
                  {user.is_admin && (
                    <Link to="/admin" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                      Administration
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <hr className="my-2" />
                  <Link to="/login" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                    Connexion
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;