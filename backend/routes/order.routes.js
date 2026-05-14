/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

// Admin notification route (must be before /:orderId)
router.get('/new', verifyFirebaseToken, requireAdmin, orderController.getNewOrders);

// User routes
router.post('/', verifyFirebaseToken, orderController.createOrder);
router.get('/my-orders', verifyFirebaseToken, orderController.getMyOrders);
router.get('/:orderId', verifyFirebaseToken, orderController.getOrderDetails);
router.put('/:orderId/cancel', verifyFirebaseToken, orderController.cancelOrder);

// Admin routes
router.get('/', verifyFirebaseToken, requireAdmin, orderController.getAllOrders);
router.put('/:orderId/status', verifyFirebaseToken, requireAdmin, orderController.updateOrderStatus);
router.put('/:orderId/payment', verifyFirebaseToken, requireAdmin, orderController.updatePaymentStatus);

module.exports = router;
