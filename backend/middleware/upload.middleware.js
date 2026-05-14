/**
 * Upload Middleware
 * Multer memoryStorage + file validation (type, size, limits)
 * No local disk writes – files stay in memory for Cloudinary upload.
 */

const multer = require('multer');
const path = require('path');

// ──────────────────────────────────────────
// Storage: memory only (no temp files on disk)
// ──────────────────────────────────────────
const storage = multer.memoryStorage();

// ──────────────────────────────────────────
// File filter: images + PDF for payment proofs
// ──────────────────────────────────────────
const allowedImageExts = /jpeg|jpg|png|gif|webp|svg/;
const allowedImageMimes = /jpeg|jpg|png|gif|webp|svg/;

function fileFilter(req, file, cb) {
  const extname = allowedImageExts.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedImageMimes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(
    new Error(
      `Invalid file type: "${file.mimetype}". Only JPEG, JPG, PNG, GIF, WebP, SVG are allowed.`
    )
  );
}

// ──────────────────────────────────────────
// Size limits
// ──────────────────────────────────────────
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024; // 5MB

// ──────────────────────────────────────────
// Pre-configured multer instances
// ──────────────────────────────────────────

const uploadSingle = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('file');

const uploadMultiple = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).array('files', 10);

const uploadProductImages = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).array('images', 6);

const uploadFeaturedImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('featuredImage');

// ──────────────────────────────────────────
// Async wrapper for multer middleware
// Turns callback-style multer middleware into async/await friendly
// ──────────────────────────────────────────
function runMulter(multerInstance) {
  return (req, res, next) => {
    multerInstance(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Max allowed is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field name in file upload.',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files uploaded.',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
}

// ──────────────────────────────────────────
// Named exports matching route needs
// ──────────────────────────────────────────
module.exports = {
  uploadSingle: runMulter(uploadSingle),
  uploadMultiple: runMulter(uploadMultiple),
  uploadProductImages: runMulter(uploadProductImages),
  uploadFeaturedImage: runMulter(uploadFeaturedImage),
  MAX_FILE_SIZE,
};
