/**
 * Auth Controller
 * Simple JWT-based auth for admin (supports both Firebase and custom JWT)
 */

const jwt = require('jsonwebtoken');
const database = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'littleshop-dev-secret-change-in-production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@littleshop.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LittleShop@2024!';

/**
 * Admin login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Validate admin credentials (accept 'admin' as alias)
    const validEmail = email === ADMIN_EMAIL || email === 'admin';
    if (!validEmail || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email, role: 'admin', adminId: 'admin_001', username: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Ensure admin user exists in database
    let user = await database.getOne('SELECT * FROM users WHERE email = ?', [ADMIN_EMAIL]);
    if (!user) {
      await database.insert(
        `INSERT INTO users (firebase_uid, email, display_name, role, is_active, last_login)
         VALUES (?, ?, ?, ?, TRUE, NOW())`,
        ['admin_001', ADMIN_EMAIL, 'Admin', 'admin']
      );
    } else {
      await database.query(
        'UPDATE users SET last_login = NOW() WHERE email = ?',
        [ADMIN_EMAIL]
      );
    }

    res.json({
      success: true,
      token,
      admin: {
        email: ADMIN_EMAIL,
        role: 'admin',
        adminId: 'admin_001',
        username: 'admin'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

/**
 * Verify token
 */
exports.verify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify custom JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      admin: {
        email: decoded.email,
        role: decoded.role,
        adminId: decoded.adminId,
        username: decoded.username
      }
    });

  } catch (error) {
    // Try Firebase verification as fallback
    try {
      const admin = require('../middleware/auth.middleware').admin;
      const decodedToken = await admin.auth().verifyIdToken(token);
      res.json({
        success: true,
        admin: {
          email: decodedToken.email,
          role: 'admin',
          adminId: decodedToken.uid,
          username: decodedToken.name || 'Admin'
        }
      });
    } catch (fbError) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }
};
