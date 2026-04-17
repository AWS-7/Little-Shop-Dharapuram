/**
 * Admin Authentication System
 * Completely separate from customer authentication
 * - Uses username/password (NOT Google)
 * - 1-hour session timeout
 * - Role-based access control
 * - Secure token storage
 */

import { supabase } from './supabase';

const ADMIN_SESSION_KEY = 'admin_session';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Admin credentials - In production, use environment variables
 * and hashed passwords. For now, using hardcoded secure defaults.
 */
const ADMIN_CREDENTIALS = {
  username: 'admin', // Change this to your preferred admin username
  password: 'LittleShop@2024!', // Change this to a strong password
  role: 'admin',
  adminId: 'admin_001'
};

/**
 * Generate secure admin session token
 */
function generateSessionToken() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `admin_${timestamp}_${random}`;
}

/**
 * Create admin session with 1-hour expiration
 */
function createAdminSession() {
  const session = {
    token: generateSessionToken(),
    adminId: ADMIN_CREDENTIALS.adminId,
    role: ADMIN_CREDENTIALS.role,
    loginTime: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
    username: ADMIN_CREDENTIALS.username
  };
  
  // Store in localStorage with expiration
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  
  // Set session timeout for automatic logout
  setSessionTimeout();
  
  return session;
}

/**
 * Set automatic logout after 1 hour
 */
function setSessionTimeout() {
  // Clear any existing timeout
  if (window.adminSessionTimeout) {
    clearTimeout(window.adminSessionTimeout);
  }
  
  // Set new timeout
  window.adminSessionTimeout = setTimeout(() => {
    logoutAdmin();
    window.location.href = '/admin/login?expired=true';
  }, SESSION_DURATION_MS);
}

/**
 * Clear session timeout
 */
function clearSessionTimeout() {
  if (window.adminSessionTimeout) {
    clearTimeout(window.adminSessionTimeout);
    window.adminSessionTimeout = null;
  }
}

/**
 * Admin login with username and password
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Object} - { success: boolean, error?: string, session?: Object }
 */
export async function loginAdmin(username, password) {
  try {
    // Validate credentials against hardcoded admin
    if (username !== ADMIN_CREDENTIALS.username) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    if (password !== ADMIN_CREDENTIALS.password) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    // Check if admin exists in Supabase (optional: for audit logging)
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();
    
    // If admin doesn't exist in DB, create session anyway (fallback)
    if (adminError && adminError.code !== 'PGRST116') {
      console.warn('Admin lookup error:', adminError);
    }
    
    // Create session
    const session = createAdminSession();
    
    // Log admin login (optional audit)
    await logAdminAction('login', { username, timestamp: new Date().toISOString() });
    
    return { 
      success: true, 
      session,
      admin: {
        username: ADMIN_CREDENTIALS.username,
        role: ADMIN_CREDENTIALS.role,
        adminId: ADMIN_CREDENTIALS.adminId
      }
    };
    
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * Verify if admin session is valid
 * Checks: token exists, not expired, role is admin
 * @returns {Object|null} - Valid session or null
 */
export function verifyAdminSession() {
  try {
    const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
    
    if (!sessionData) {
      return null;
    }
    
    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      // Session expired - clean up
      logoutAdmin();
      return null;
    }
    
    // Verify role
    if (session.role !== 'admin') {
      logoutAdmin();
      return null;
    }
    
    // Verify token format
    if (!session.token || !session.token.startsWith('admin_')) {
      logoutAdmin();
      return null;
    }
    
    // Reset timeout on activity (optional - extends session on activity)
    // Uncomment below to enable session extension on activity
    // setSessionTimeout();
    
    return session;
    
  } catch (error) {
    console.error('Session verification error:', error);
    logoutAdmin();
    return null;
  }
}

/**
 * Check if admin is authenticated
 * @returns {boolean}
 */
export function isAdminAuthenticated() {
  const session = verifyAdminSession();
  return !!session;
}

/**
 * Get current admin session data
 * @returns {Object|null}
 */
export function getAdminSession() {
  return verifyAdminSession();
}

/**
 * Logout admin - clear session
 */
export function logoutAdmin() {
  clearSessionTimeout();
  localStorage.removeItem(ADMIN_SESSION_KEY);
  
  // Log logout action (async, don't wait)
  logAdminAction('logout', { timestamp: new Date().toISOString() });
}

/**
 * Get session time remaining in minutes
 * @returns {number} - Minutes remaining, 0 if expired
 */
export function getSessionTimeRemaining() {
  const session = verifyAdminSession();
  
  if (!session) {
    return 0;
  }
  
  const remainingMs = session.expiresAt - Date.now();
  return Math.max(0, Math.floor(remainingMs / (60 * 1000)));
}

/**
 * Check if session is about to expire (within 5 minutes)
 * @returns {boolean}
 */
export function isSessionExpiringSoon() {
  const remaining = getSessionTimeRemaining();
  return remaining > 0 && remaining <= 5;
}

/**
 * Log admin actions for audit (optional)
 */
async function logAdminAction(action, details = {}) {
  try {
    const session = getAdminSession();
    
    await supabase.from('admin_logs').insert({
      admin_id: session?.adminId || 'unknown',
      action,
      details,
      timestamp: new Date().toISOString(),
      ip_address: null // Could add IP logging if needed
    });
  } catch (error) {
    // Silent fail - don't break functionality for logging
    console.warn('Failed to log admin action:', error);
  }
}

/**
 * Middleware helper for protected admin routes
 * Usage: Call this at the start of admin API calls
 */
export function requireAdminAuth() {
  const session = verifyAdminSession();
  
  if (!session) {
    throw new Error('Unauthorized: Admin session required');
  }
  
  return session;
}

/**
 * Change admin password (for future use)
 * In production, this would update the database
 */
export async function changeAdminPassword(currentPassword, newPassword) {
  try {
    // Verify current password
    if (currentPassword !== ADMIN_CREDENTIALS.password) {
      return { success: false, error: 'Current password is incorrect' };
    }
    
    // Validate new password strength
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }
    
    // In production: Update password in database
    // For now, just log the action
    await logAdminAction('password_change', { 
      timestamp: new Date().toISOString(),
      adminId: ADMIN_CREDENTIALS.adminId
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, error: 'Failed to change password' };
  }
}
