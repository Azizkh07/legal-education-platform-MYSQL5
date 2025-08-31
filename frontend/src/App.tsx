import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './lib/AuthContext';

// Components
import Loading from './components/Loading';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import CoursesPage from './pages/CoursesPage';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/AdminDashboard';
import DraftsPage from './pages/DraftPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return <Loading fullScreen text={t('auth.checking_auth', 'Checking authentication...')} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return <Loading fullScreen text={t('auth.checking_admin', 'Checking admin rights...')} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {t('user.access_denied', 'Access Denied')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('user.no_permission', 'You don\'t have permission to access this page.')}
          </p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition"
          >
            {t('user.return_home', 'Return to Home')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Guest Route Component
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (isAuthenticated) {
    if (user?.is_admin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};


const SessionMonitor: React.FC = () => {
  const { isAuthenticated, validateSession, logout } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isValidatingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if user is not logged in
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('SessionMonitor: Starting aggressive session monitoring');

    // Validate session immediately on mount
    if (!isValidatingRef.current) {
      validateSession();
    }

    // Set up aggressive periodic validation every 15 seconds
    intervalRef.current = setInterval(async () => {
      if (isValidatingRef.current) {
        console.log('Session validation already in progress, skipping...');
        return;
      }
      
      isValidatingRef.current = true;
      try {
        console.log('Periodic session validation check');
        const isValid = await validateSession();
        if (!isValid) {
          console.log('Session invalid during periodic check, logging out...');
          logout();
          alert('Your session has been terminated from another location. Please log in again.');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Session validation error:', error);
        logout();
        alert('Session validation failed. Please log in again.');
        window.location.href = '/login';
      } finally {
        isValidatingRef.current = false;
      }
    }, 15000); // Check every 15 seconds for more aggressive enforcement

    // Validate on window focus (when user switches back to tab)
    const handleFocus = async () => {
      if (isValidatingRef.current) return;
      
      isValidatingRef.current = true;
      try {
        console.log('Window focused, validating session');
        const isValid = await validateSession();
        if (!isValid) {
          console.log('Session invalid on focus, logging out...');
          logout();
          alert('Your session was terminated from another location. Please log in again.');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Session validation on focus error:', error);
        logout();
        alert('Session validation failed. Please log in again.');
        window.location.href = '/login';
      } finally {
        isValidatingRef.current = false;
      }
    };

    // Validate on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (!document.hidden && !isValidatingRef.current) {
        console.log('Tab became visible, checking session health');
        handleFocus();
      }
    };

    // Also check when user comes back online
    const handleOnline = () => {
      if (!isValidatingRef.current) {
        console.log('Connection restored, checking session health');
        handleFocus();
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [isAuthenticated, validateSession, logout]);

  return null; // This component doesn't render anything
};

function App() {
  return (
    <AuthProvider>
      <SessionMonitor />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/blog/drafts" element={<DraftsPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Guest Routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />

        {/* Protected Routes */}

        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;