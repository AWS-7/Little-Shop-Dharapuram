/**
 * Cloudinary SDK Configuration
 * Secure, production-ready setup
 */

const cloudinary = require('cloudinary').v2;

// Validate required environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.warn(
    `⚠️  Cloudinary environment variables missing: ${missingVars.join(', ')}. ` +
    `Image uploads will fail. Add them to your .env file.`
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;
