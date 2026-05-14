/**
 * Upload Routes
 * Handles file uploads via Cloudinary
 */

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');
const { uploadSingle, uploadMultiple } = require('../middleware/upload.middleware');

// Single file upload
router.post('/single', verifyFirebaseToken, requireAdmin, uploadSingle, uploadController.uploadSingle);

// Multiple files upload
router.post('/multiple', verifyFirebaseToken, requireAdmin, uploadMultiple, uploadController.uploadMultiple);

// Product image upload
router.post('/product-image', verifyFirebaseToken, requireAdmin, uploadSingle, uploadController.uploadProductImage);
router.post('/products', verifyFirebaseToken, requireAdmin, uploadSingle, uploadController.uploadProductImage);

// Category image upload
router.post('/category-image', verifyFirebaseToken, requireAdmin, uploadSingle, uploadController.uploadCategoryImage);

// Hero banner upload
router.post('/banner', verifyFirebaseToken, requireAdmin, uploadSingle, uploadController.uploadBanner);

// Payment proof upload (user)
router.post('/payment-proof', verifyFirebaseToken, uploadSingle, uploadController.uploadPaymentProof);

// Delete file
router.delete('/:filename', verifyFirebaseToken, requireAdmin, uploadController.deleteFile);

// Get uploaded files list
router.get('/list', verifyFirebaseToken, requireAdmin, uploadController.getUploadedFiles);

module.exports = router;
