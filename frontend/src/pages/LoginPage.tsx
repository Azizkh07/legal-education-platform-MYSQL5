import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface LoginCredentials {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: '', password: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Parse redirect URL from query parameters
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Login attempt with:', { email: credentials.email, passwordLength: credentials.password.length });
      
      // Pass email and password directly as separate arguments
      await login(credentials.email, credentials.password);
      
      console.log('✅ Login successful, navigating to:', redirectPath);
      
      // Get user data from localStorage to determine navigation
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData.is_admin) {
            console.log('👑 Admin user detected, redirecting to admin dashboard');
            navigate('/admin');
            return;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // For regular users or if user data parsing failed
      navigate(redirectPath);
      
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Log In</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            {(error || authError) && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                <p>{error || authError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-md text-white font-semibold transition ${
                  loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/contact" className="text-blue-600 hover:underline">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LoginPage;