import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';


// Components
import Loading from './components/Loading';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/AdminDashboard';
import DraftsPage from './pages/DraftPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Vérification de l'authentification..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isAuthenticated, user } = useAuth();

  console.log('🎯 AdminRoute: Checking admin access...');
  console.log('📊 loading:', loading);
  console.log('📊 isAuthenticated:', isAuthenticated);
  console.log('📊 user:', user);

  if (loading) {
    return <Loading fullScreen text="Vérification des droits d'administration..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_admin) {
    console.log('🚫 Access denied: User is not an admin');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition"
          >
            Return to Home
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

  console.log('👻 GuestRoute: Checking guest access...');
  console.log('📊 loading:', loading);
  console.log('📊 isAuthenticated:', isAuthenticated);

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/blog/drafts" element={<DraftsPage />} />   {/* <-- ADD THIS */}

          <Route path="/contact" element={<ContactPage />} />


          
          
          {/* Guest Routes (only for non-authenticated users) */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          
          {/* Protected Routes (require authentication) */}
          <Route path="/dashboard/courses/:courseId" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
          
          {/* Admin Routes (require admin permission) */}
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />


        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;