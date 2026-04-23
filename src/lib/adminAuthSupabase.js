/**
 * Admin Authentication with Supabase (Cross-Device)
 * Uses Supabase Auth instead of localStorage for multi-device support
 */

import { supabase } from './supabase';

const ADMIN_EMAIL = 'admin@littleshop.com'; // Fixed admin email

/**
 * Login admin with email and password using Supabase Auth
 * This allows cross-device authentication
 */
export async function loginAdminSupabase(email, password) {
  try {
    // First, verify against hardcoded admin credentials
    if (email !== ADMIN_EMAIL || password !== 'LittleShop@2024!') {
      return { success: false, error: 'Invalid email or password' };
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: password,
    });

    if (error) {
      console.error('Supabase signin error:', error);
      
      // If user doesn't exist in Supabase, we need to sign them up first
      if (error.message?.includes('Invalid login') || error.code === 'invalid_credentials') {
        console.log('Admin user not found, attempting signup...');
        
        // Try to sign up the admin user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: ADMIN_EMAIL,
          password: password,
          options: {
            data: {
              role: 'admin',
              adminId: 'admin_001',
              username: 'admin'
            }
          }
        });

        if (signUpError) {
          console.error('Admin signup failed:', signUpError);
          return { success: false, error: `Signup failed: ${signUpError.message}` };
        }

        console.log('Signup successful, attempting signin...');

        // Sign in again after signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: password,
        });

        if (signInError) {
          console.error('Signin after signup failed:', signInError);
          return { success: false, error: `Login after signup failed: ${signInError.message}` };
        }

        return {
          success: true,
          session: signInData.session,
          admin: {
            email: ADMIN_EMAIL,
            role: 'admin',
            adminId: 'admin_001',
            username: 'admin'
          }
        };
      }

      return { success: false, error: `Auth error: ${error.message || error.code || 'Unknown error'}` };
    }

    // Successful login
    return {
      success: true,
      session: data.session,
      admin: {
        email: ADMIN_EMAIL,
        role: 'admin',
        adminId: 'admin_001',
        username: 'admin'
      }
    };

  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * Check if admin is authenticated using Supabase session
 */
export async function isAdminAuthenticatedSupabase() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }

    // Verify admin role in user metadata
    const userRole = session.user?.user_metadata?.role;
    return userRole === 'admin';
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
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }

    // Verify admin role
    const userRole = session.user?.user_metadata?.role;
    if (userRole !== 'admin') {
      return null;
    }

    return {
      token: session.access_token,
      adminId: session.user.user_metadata?.adminId || 'admin_001',
      role: 'admin',
      email: session.user.email,
      expiresAt: new Date(session.expires_at * 1000).getTime()
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Logout admin from Supabase
 */
export async function logoutAdminSupabase() {
  try {
    await supabase.auth.signOut();
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
 * Setup admin user in Supabase (run once)
 */
export async function setupAdminUser() {
  try {
    // Check if admin user already exists by trying to sign in
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: 'LittleShop@2024!'
    });

    if (!error) {
      console.log('Admin user already exists');
      return { success: true, message: 'Admin already set up' };
    }

    // Create admin user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: 'LittleShop@2024!',
      options: {
        data: {
          role: 'admin',
          adminId: 'admin_001',
          username: 'admin'
        }
      }
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
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
  return supabase.auth.onAuthStateChange((event, session) => {
    const isAdmin = session?.user?.user_metadata?.role === 'admin';
    callback(event, isAdmin ? session : null);
  });
}

// NOTE: Supabase Auth requires additional setup (Auth settings, email confirmation, etc.)
// For now, re-export from old adminAuth.js for backward compatibility
// To enable Supabase Auth, update imports in components to use the Supabase functions directly

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

// Supabase functions (for future use when Auth is properly configured)
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
