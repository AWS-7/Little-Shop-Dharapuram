/**
 * Cart Routes
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { verifyFirebaseToken, optionalAuth } = require('../middleware/auth.middleware');

// Get cart - works with or without auth (session-based for guests)
router.get('/', optionalAuth, cartController.getCart);

// Add to cart
router.post('/add', optionalAuth, cartController.addToCart);

// Update cart item quantity
router.put('/update/:cartItemId', verifyFirebaseToken, cartController.updateCartItem);

// Remove from cart
router.delete('/remove/:cartItemId', verifyFirebaseToken, cartController.removeFromCart);

// Clear cart
router.delete('/clear', verifyFirebaseToken, cartController.clearCart);

// Sync cart (for guest to logged-in user)
router.post('/sync', verifyFirebaseToken, cartController.syncCart);

// Get cart summary (counts, totals)
router.get('/summary', optionalAuth, cartController.getCartSummary);

module.exports = router;
