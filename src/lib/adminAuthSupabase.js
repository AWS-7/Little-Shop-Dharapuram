/**
 * Admin Authentication (Cross-Device)
 * Uses new backend API for multi-device support
 */

// MIGRATED: Using new backend API instead of Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const ADMIN_EMAIL = 'admin@littleshop.com'; // Fixed admin email

/**
 * Login admin with email and password using backend API
 * This allows cross-device authentication
 */
export async function loginAdminSupabase(email, password) {
  try {
    // First, verify against hardcoded admin credentials
    if (email !== ADMIN_EMAIL || password !== 'LittleShop@2024!') {
      return { success: false, error: 'Invalid email or password' };
    }

    // Authenticate with new backend
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: password
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        return { success: false, error: result.message || 'Login failed' };
      }

      // Store token
      if (result.token) {
        localStorage.setItem('adminToken', result.token);
      }

      return {
        success: true,
        session: { token: result.token },
        admin: {
          email: ADMIN_EMAIL,
          role: 'admin',
          adminId: 'admin_001',
          username: 'admin'
        }
      };
    } catch (error) {
      return { success: false, error: `Auth error: ${error.message || 'Unknown error'}` };
    }

  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * Check if admin is authenticated using backend API
 */
export async function isAdminAuthenticatedSupabase() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) return false;
    
    // Verify token with backend
    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    return result.success && result.data?.role === 'admin';
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

/**
 * Get current admin session
 */
export async function getAdminSessionSupabase() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) return null;
    
    // Verify token with backend
    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (result.success && result.data?.role === 'admin') {
      return { token };
    }
    return null;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

/**
 * Logout admin
 */
export async function logoutAdminSupabase() {
  try {
    localStorage.removeItem('adminToken');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get session time remaining
 */
export async function getSessionTimeRemainingSupabase() {
  const session = await getAdminSessionSupabase();
  
  if (!session) {
    return 0;
  }
  
  const remainingMs = session.expiresAt - Date.now();
  return Math.max(0, Math.floor(remainingMs / (60 * 1000)));
}

/**
 * Check if session is expiring soon
 */
export async function isSessionExpiringSoonSupabase() {
  const remaining = await getSessionTimeRemainingSupabase();
  return remaining > 0 && remaining <= 5;
}

/**
 * Setup admin user (run once)
 */
export async function setupAdminUser() {
  try {
    // Check if admin user already exists
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: 'LittleShop@2024!'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Admin user already exists');
      return { success: true, message: 'Admin already set up' };
    }

    // Create admin user via backend
    const signupResponse = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: 'LittleShop@2024!',
        role: 'admin'
      })
    });

    const signupResult = await signupResponse.json();

    if (!signupResult.success) {
      return { success: false, error: signupResult.message };
    }

    return { success: true, message: 'Admin user created' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Listen for auth state changes
 */
export function onAdminAuthStateChange(callback) {
  // No realtime auth state with REST API - use polling instead
  console.log('⚠️ Realtime auth state not available with REST API');
  return { data: { subscription: { unsubscribe: () => {} } } };
}

// NOTE: Backend API authentication is now active
// All auth functions use the new backend API

import {
  loginAdmin,
  isAdminAuthenticated,
  getAdminSession,
  logoutAdmin,
  getSessionTimeRemaining,
  isSessionExpiringSoon
} from './adminAuth';

// Re-export old functions for compatibility
export {
  loginAdmin,
  isAdminAuthenticated,
  getAdminSession,
  logoutAdmin,
  getSessionTimeRemaining,
  isSessionExpiringSoon
};

// Backend API functions
export {
  loginAdminSupabase,
  isAdminAuthenticatedSupabase,
  getAdminSessionSupabase,
  logoutAdminSupabase,
  getSessionTimeRemainingSupabase,
  isSessionExpiringSoonSupabase,
  setupAdminUser,
  onAdminAuthStateChange
};

// Default export - uses old system for now
export default {
  loginAdmin,
  isAdminAuthenticated,
  getAdminSession,
  logoutAdmin,
  getSessionTimeRemaining,
  isSessionExpiringSoon
};
