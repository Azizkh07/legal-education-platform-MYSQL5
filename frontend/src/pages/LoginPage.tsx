import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/LoginPage.css';

interface LoginCredentials {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, loading: authLoading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: '', password: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Parse redirect URL from query parameters
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    // Trigger animations
    setTimeout(() => setIsVisible(true), 300);

    // Mouse tracking for parallax effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Login attempt with:', { email: credentials.email, passwordLength: credentials.password.length });
      const user = await login(credentials.email, credentials.password); // will throw if failed

      console.log('✅ Login successful, user:', user);

      // Navigate based on role
      if (user?.is_admin) {
        navigate('/admin');
        return;
      }

      // Regular user -> redirect path
      navigate(redirectPath);
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <div className="login-page-container">
      <Header />

      {/* Login Section */}
      <section className="login-section">
        <div className="login-grid" />

        <div className="particles-container">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={`particle particle-${i % 4}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="login-bg-shapes">
          <div
            className="bg-shape shape-1"
            style={{
              transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px) rotate(${mousePosition.x * 3}deg)`
            }}
          />
          <div
            className="bg-shape shape-2"
            style={{
              transform: `translate(${mousePosition.x * -10}px, ${mousePosition.y * -10}px) rotate(${mousePosition.y * -2}deg)`
            }}
          />
          <div
            className="bg-shape shape-3"
            style={{
              transform: `translate(${mousePosition.x * 8}px, ${mousePosition.y * 18}px)`
            }}
          />
        </div>

        <div className="login-content">
          <div className="container">
            {/* Centered Form Layout */}
            <div className="login-centered-layout">
              <div className={`login-form-container ${isVisible ? 'animate-in' : ''}`}>
                <div className="login-form-wrapper">
                  <div className="login-header">
                 

                    <h1 className="login-title">
                      <span className="title-line">Bienvenue</span>
                      <span className="title-highlight">de retour</span>
                    </h1>

                    <p className="login-description">
                      Connectez-vous à votre compte pour accéder à vos cours et ressources juridiques
                    </p>
                  </div>
                 

                  <div className="login-form-card">
                    {displayError && (
                      <div className="error-alert">
                        <p>{displayError}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="login-form">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">
                          Adresse Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={credentials.email}
                          onChange={handleChange}
                          required
                          className="form-input"
                          placeholder="votre.email@exemple.com"
                          disabled={loading || authLoading}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="password" className="form-label">
                          Mot de passe
                        </label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={credentials.password}
                          onChange={handleChange}
                          required
                          className="form-input"
                          placeholder="••••••••"
                          disabled={loading || authLoading}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || authLoading}
                        className={`login-btn ${loading || authLoading ? 'loading' : ''}`}
                      >
                        <span className="btn-bg" />
                        <span className="btn-text">
                          {loading || authLoading ? (
                            <>
                              <div className="loading-spinner" />
                              Connexion...
                            </>
                          ) : (
                            'Se connecter'
                          )}
                        </span>
                        <div className="btn-shine" />
                      </button>
                    </form>

                    <div className="login-footer">
                      <div className="divider">
                        <span className="divider-text">Nouveau ici ?</span>
                      </div>
                      
                      <p className="signup-text">
                        Vous n'avez pas encore de compte ?{' '}
                        <Link to="/contact" className="signup-link">
                          <span>Contactez-nous</span>
                          <div className="link-underline" />
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </section>

    </div>
  );
};

export default LoginPage;