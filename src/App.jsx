import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';
import PageTransition from './components/layout/PageTransition';

// Eager load critical components
import { ClientProtectedRoute, AdminProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';

// Lazy load all pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Account = lazy(() => import('./pages/Account'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* PUBLIC AUTH ROUTES */}
        <Route 
          path="/login" 
          element={
            <PublicOnlyRoute>
              <Suspense fallback={<PageLoader />}>
                <Login />
              </Suspense>
            </PublicOnlyRoute>
          } 
        />

        {/* STOREFRONT — uses shared Layout (Header + Footer + Mobile Nav) */}
        <Route element={<Layout />}>
          {/* Public Routes */}
          <Route path="/" element={<PageTransition><Suspense fallback={<PageLoader />}><Home /></Suspense></PageTransition>} />
          <Route path="/shop" element={<PageTransition><Suspense fallback={<PageLoader />}><Shop /></Suspense></PageTransition>} />
          <Route path="/product/:id" element={<PageTransition><Suspense fallback={<PageLoader />}><ProductDetail /></Suspense></PageTransition>} />
          <Route path="/collections" element={<PageTransition><Suspense fallback={<PageLoader />}><Shop /></Suspense></PageTransition>} />
          <Route path="/new-arrivals" element={<PageTransition><Suspense fallback={<PageLoader />}><Shop /></Suspense></PageTransition>} />
          <Route path="/track-order" element={<PageTransition><Suspense fallback={<PageLoader />}><TrackOrder /></Suspense></PageTransition>} />

          <Route path="/cart" element={<PageTransition><Suspense fallback={<PageLoader />}><Cart /></Suspense></PageTransition>} />

          {/* Protected Client Routes - Require Google Auth */}
          <Route 
            path="/checkout" 
            element={
              <ClientProtectedRoute>
                <PageTransition><Suspense fallback={<PageLoader />}><Checkout /></Suspense></PageTransition>
              </ClientProtectedRoute>
            } 
          />
          <Route 
            path="/order-success" 
            element={
              <ClientProtectedRoute>
                <PageTransition><Suspense fallback={<PageLoader />}><OrderSuccess /></Suspense></PageTransition>
              </ClientProtectedRoute>
            } 
          />
          <Route 
            path="/wishlist" 
            element={
              <ClientProtectedRoute>
                <PageTransition><Suspense fallback={<PageLoader />}><Wishlist /></Suspense></PageTransition>
              </ClientProtectedRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <ClientProtectedRoute>
                <PageTransition><Suspense fallback={<PageLoader />}><Account /></Suspense></PageTransition>
              </ClientProtectedRoute>
            } 
          />
          <Route 
            path="/my-orders" 
            element={
              <ClientProtectedRoute>
                <PageTransition><Suspense fallback={<PageLoader />}><MyOrders /></Suspense></PageTransition>
              </ClientProtectedRoute>
            } 
          />
        </Route>

        {/* ADMIN ROUTES — Protected, standalone layout */}
        <Route 
          path="/admin" 
          element={<Navigate to="/admin/dashboard" replace />} 
        />
        <Route 
          path="/admin/login" 
          element={
            <PublicOnlyRoute>
              <Suspense fallback={<PageLoader />}>
                <AdminLogin />
              </Suspense>
            </PublicOnlyRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/order/:id" 
          element={
            <AdminProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <AdminOrderDetail />
              </Suspense>
            </AdminProtectedRoute>
          } 
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
