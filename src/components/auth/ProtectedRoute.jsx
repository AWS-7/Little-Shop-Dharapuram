import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../../lib/firebaseAuth';
import { ADMIN_MOBILE_NUMBER } from '../../lib/constants';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
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
export function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const admin = isAdmin(ADMIN_MOBILE_NUMBER);

  if (!authenticated) {
    // Not logged in - redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!admin) {
    // Logged in but not admin - redirect to shop
    return <Navigate to="/shop" replace />;
  }

  return children;
}

// Protected route that redirects authenticated users away
// (useful for login page - redirect to dashboard if already logged in)
export function PublicOnlyRoute({ children }) {
  const authenticated = isAuthenticated();
  const admin = isAdmin(ADMIN_MOBILE_NUMBER);

  if (authenticated) {
    // Already logged in - redirect to appropriate dashboard
    if (admin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/shop" replace />;
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
