/**
 * Little Shop Dharapuram - Backend Server
 * Node.js + Express.js + MySQL
 * Replaces Supabase Backend
 */

require('dotenv').config();
const app = require('./app');
const database = require('./config/database');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database connection check on startup
const startServer = async () => {
  try {
    // Debug: verify Cloudinary env vars
    console.log('🔧 Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
    });

    // Test database connection
    const db = await database.getConnection();
    console.log('✅ MySQL Database connected successfully');
    db.release();

    // Start server
    app.listen(PORT, () => {
      console.log(`
🚀 Server running on port ${PORT}
📁 Environment: ${NODE_ENV}
🔗 API Base URL: http://localhost:${PORT}/api/v1
📊 Health Check: http://localhost:${PORT}/health
      `);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Please check your database configuration in .env file');
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
