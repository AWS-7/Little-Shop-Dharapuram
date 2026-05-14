/**
 * Category Routes
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

// Admin routes
router.post('/', verifyFirebaseToken, requireAdmin, categoryController.createCategory);
router.put('/:id', verifyFirebaseToken, requireAdmin, categoryController.updateCategory);
router.delete('/:id', verifyFirebaseToken, requireAdmin, categoryController.deleteCategory);

module.exports = router;
