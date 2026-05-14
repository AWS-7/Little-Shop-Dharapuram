/**
 * Authentication Middleware
 * Verifies Firebase ID Tokens OR Custom JWT Tokens
 */

const jwt = require('jsonwebtoken');
const database = require('../config/database');

// JWT secret for custom tokens
const JWT_SECRET = process.env.JWT_SECRET || 'littleshop-dev-secret-change-in-production';

// Optional Firebase Admin SDK
let admin = null;
try {
  admin = require('firebase-admin');
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }
  }
} catch (e) {
  console.log('Firebase Admin not configured:', e.message);
}

/**
 * Verify token - tries Firebase first, then custom JWT
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

    // Try Firebase verification first (only for valid JWT-looking tokens)
    const isJWT = token.split('.').length === 3;
    if (isJWT && admin && admin.apps.length) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        req.firebaseUser = decodedToken;
        req.firebaseUid = decodedToken.uid;

        let user = await database.getOne(
          'SELECT * FROM users WHERE firebase_uid = ?',
          [decodedToken.uid]
        );

        if (!user) {
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
          user = await database.getOne('SELECT * FROM users WHERE id = ?', [userId]);
        } else {
          await database.query(
            'UPDATE users SET last_login = NOW(), email = ? WHERE id = ?',
            [decodedToken.email || user.email, user.id]
          );
        }

        req.user = user;
        req.userId = user.id;
        return next();
      } catch (fbError) {
        // Firebase verification failed, try custom JWT
      }
    }

    // Try custom JWT verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Look up user by email
      let user = await database.getOne(
        'SELECT * FROM users WHERE email = ?',
        [decoded.email]
      );

      if (!user) {
        // Create user if not exists
        const userId = await database.insert(
          `INSERT INTO users (firebase_uid, email, display_name, role, is_active, last_login)
           VALUES (?, ?, ?, ?, TRUE, NOW())`,
          [decoded.adminId || decoded.sub || 'custom_' + Date.now(), decoded.email, decoded.username || 'Admin', decoded.role || 'customer']
        );
        user = await database.getOne('SELECT * FROM users WHERE id = ?', [userId]);
      }

      req.user = user;
      req.userId = user.id;
      req.firebaseUid = user.firebase_uid;

      return next();

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
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

    // Try Firebase token (only for valid JWT-looking tokens)
    const isJWT = token.split('.').length === 3;
    if (isJWT && admin && admin.apps.length) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.firebaseUser = decodedToken;
        req.firebaseUid = decodedToken.uid;
        const user = await database.getOne('SELECT * FROM users WHERE firebase_uid = ?', [decodedToken.uid]);
        if (user) { req.user = user; req.userId = user.id; }
        return next();
      } catch (e) {
        // Try custom JWT
      }
    }

    // Try custom JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await database.getOne('SELECT * FROM users WHERE email = ?', [decoded.email]);
      if (user) { req.user = user; req.userId = user.id; req.firebaseUid = user.firebase_uid; }
    } catch (e) {
      // Silently ignore
    }

    next();

  } catch (error) {
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
