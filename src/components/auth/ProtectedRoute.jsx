import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../lib/firebaseAuth';
import { isAdminAuthenticated, getSessionTimeRemaining } from '../../lib/adminAuth';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-purple-primary/10 border-t-purple-primary rounded-full animate-spin mx-auto mb-6" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity Securely Loading</p>
    </div>
  </div>
);

// Protected route for authenticated users (clients)
export function ClientProtectedRoute({ children }) {
  const location = useLocation();
  const authenticated = isAuthenticated();

  if (!authenticated) {
    // Redirect to login, save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Protected route for admin only
// Uses completely separate admin auth system (NOT Google)
export function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const adminAuthenticated = isAdminAuthenticated();
  
  // Check for session expiration message
  const isExpired = location.search.includes('expired=true');

  if (!adminAuthenticated) {
    // Not logged in as admin - redirect to admin login
    // Never redirect to customer login for admin routes
    return <Navigate to="/admin/login" state={{ from: location, expired: isExpired }} replace />;
  }

  // Admin is authenticated - check session time
  const timeRemaining = getSessionTimeRemaining();
  
  if (timeRemaining <= 0) {
    // Session expired - force logout and redirect
    return <Navigate to="/admin/login?expired=true" replace />;
  }

  return children;
}

// Protected route that redirects authenticated users away
// (useful for login page - redirect to dashboard if already logged in)
export function PublicOnlyRoute({ children }) {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const adminAuthenticated = isAdminAuthenticated();
  
  // Check if this is the admin login page
  const isAdminLogin = location.pathname === '/admin/login';

  if (isAdminLogin) {
    // For admin login page - only check admin auth
    if (adminAuthenticated) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Allow access to admin login if not authenticated as admin
    return children;
  }

  // For customer login pages
  if (authenticated) {
    return <Navigate to="/account" replace />;
  }

  return children;
}

// Fallback route for 404s
export function NotFoundRoute() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-purple-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <a 
          href="/" 
          className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
