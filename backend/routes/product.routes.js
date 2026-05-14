/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyFirebaseToken, optionalAuth, requireAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/bestsellers', productController.getBestsellers);
router.get('/handpicked', productController.getHandpickedProducts);
router.get('/search', productController.searchProducts);
router.get('/categories/:categorySlug', productController.getProductsByCategory);
router.get('/category/:categorySlug', productController.getProductsByCategory);
router.get('/:slug', productController.getProductBySlug);

// Protected routes (Admin only)
router.post('/', verifyFirebaseToken, requireAdmin, productController.createProduct);
router.put('/:id', verifyFirebaseToken, requireAdmin, productController.updateProduct);
router.delete('/:id', verifyFirebaseToken, requireAdmin, productController.deleteProduct);
router.patch('/:id/stock', verifyFirebaseToken, requireAdmin, productController.updateStock);

module.exports = router;
