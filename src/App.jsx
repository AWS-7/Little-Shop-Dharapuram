import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';
import PageTransition from './components/layout/PageTransition';

// Firebase Auth Pages
import Login from './pages/Login';

// Storefront Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Wishlist from './pages/Wishlist';
import TrackOrder from './pages/TrackOrder';
import Account from './pages/Account';
import MyOrders from './pages/MyOrders';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';

// Protected Route Components
import { ClientProtectedRoute, AdminProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';

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
              <Login />
            </PublicOnlyRoute>
          } 
        />

        {/* STOREFRONT — uses shared Layout (Header + Footer + Mobile Nav) */}
        <Route element={<Layout />}>
          {/* Public Routes */}
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
          <Route path="/collections" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/new-arrivals" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/track-order" element={<PageTransition><TrackOrder /></PageTransition>} />

          <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />

          {/* Protected Client Routes - Require Google Auth */}
          <Route 
            path="/checkout" 
            element={
              <ClientProtectedRoute>
                <PageTransition><Checkout /></PageTransition>
              </ClientProtectedRoute>
            } 
          />
          <Route 
            path="/order-success" 
            element={
              <ClientProtectedRoute>
                <PageTransition><OrderSuccess /></PageTransition>
              </ClientProtectedRoute>
            } 
          />
          <Route 
            path="/wishlist" 
            element={
              <ClientProtectedRoute>
                <PageTransition><Wishlist /></PageTransition>
              </ClientProtectedRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <ClientProtectedRoute>
                <PageTransition><Account /></PageTransition>
              </ClientProtectedRoute>
            } 
          />
          <Route 
            path="/my-orders" 
            element={
              <ClientProtectedRoute>
                <PageTransition><MyOrders /></PageTransition>
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
              <AdminLogin />
            </PublicOnlyRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin/order/:id" 
          element={
            <AdminProtectedRoute>
              <AdminOrderDetail />
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
