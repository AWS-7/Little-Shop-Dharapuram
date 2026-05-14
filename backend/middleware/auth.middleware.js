/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID Tokens
 */

const admin = require('firebase-admin');
const database = require('../config/database');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

/**
 * Verify Firebase ID Token
 * Extracts token from Authorization header
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user info to request
    req.firebaseUser = decodedToken;
    req.firebaseUid = decodedToken.uid;
    
    // Get or create user in MySQL database
    let user = await database.getOne(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [decodedToken.uid]
    );
    
    if (!user) {
      // Create new user in database
      const userId = await database.insert(
        `INSERT INTO users (firebase_uid, email, display_name, photo_url, last_login) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          decodedToken.uid,
          decodedToken.email || null,
          decodedToken.name || null,
          decodedToken.picture || null
        ]
      );
      
      user = await database.getOne(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
    } else {
      // Update last login
      await database.query(
        'UPDATE users SET last_login = NOW(), email = ? WHERE id = ?',
        [decodedToken.email || user.email, user.id]
      );
    }
    
    req.user = user;
    req.userId = user.id;
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional Authentication
 * Doesn't require token but attaches user if available
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return next();
    }
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.firebaseUser = decodedToken;
    req.firebaseUid = decodedToken.uid;
    
    // Get user from database
    const user = await database.getOne(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [decodedToken.uid]
    );
    
    if (user) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
    
  } catch (error) {
    // Don't fail request, just don't attach user
    next();
  }
};

/**
 * Admin Authorization Middleware
 * Requires user to have admin role
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    next();
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

/**
 * Super Admin Authorization
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }
    
    next();
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

module.exports = {
  verifyFirebaseToken,
  optionalAuth,
  requireAdmin,
  requireSuperAdmin,
  admin
};
